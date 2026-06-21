import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import {
  catchError,
  concatMap,
  EMPTY,
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  Subject,
  tap,
  throwError,
} from 'rxjs';

import { VoucherDropzoneComponent } from '../../../../shared/components/voucher-dropzone/voucher-dropzone.component';
import { showError } from '../../../../../utils/notifications';
import { notifyWooCommerceSyncResult } from '../../../../../utils/woo-commerce-sync-feedback';
import {
  ProductMediaItem,
  ProductMediaUploadResponse,
  WooCommerceSyncResult,
} from '../../models/product-media.model';
import { ProductMediaService } from '../../services/product-media.service';
import { ProductsService } from '../../services/products.service';

type UploadJobStatus = 'queued' | 'uploading' | 'done' | 'error';

interface UploadJob {
  file: File;
  status: UploadJobStatus;
  media?: ProductMediaItem;
}

@Component({
  selector: 'app-product-gallery',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
    TooltipModule,
    VoucherDropzoneComponent,
  ],
  templateUrl: './product-gallery.component.html',
  styleUrl: './product-gallery.component.scss',
  providers: [MessageService],
})
export class ProductGalleryComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) productId!: number;
  @Output() mediaCountChange = new EventEmitter<number>();

  @ViewChild('mediaDropzone') mediaDropzone?: VoucherDropzoneComponent;

  mediaItems: ProductMediaItem[] = [];
  pendingFiles: File[] = [];
  displayUrls = new Map<number, string>();

  isLoading = false;
  deletingMediaId: number | null = null;

  readonly maxFileSizeMb = 5;
  readonly maxFiles = 10;
  readonly accept = 'image/jpeg,image/png,image/webp';

  private readonly uploadJobs = new Map<string, UploadJob>();
  private readonly uploadQueue$ = new Subject<string>();
  private readonly localPreviewByKey = new Map<string, string>();
  private queueWaiters: Array<{
    quiet: boolean;
    resolve: (items: ProductMediaItem[]) => void;
    reject: (err: unknown) => void;
  }> = [];
  private sessionUploaded: ProductMediaItem[] = [];
  private sessionWorstSync: WooCommerceSyncResult | undefined;

  constructor(
    private readonly productsService: ProductsService,
    private readonly productMediaService: ProductMediaService,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadGallery();
    this.uploadQueue$
      .pipe(
        concatMap(key => this.processUploadJob(key)),
      )
      .subscribe({
        error: err => this.failWaiters(err),
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && !changes['productId'].firstChange) {
      this.resetUploadState();
      this.pendingFiles = [];
      this.mediaDropzone?.clear();
      this.loadGallery();
    }
  }

  ngOnDestroy(): void {
    this.revokeDisplayUrls();
    this.revokeLocalPreviews();
    this.queueWaiters = [];
  }

  get isDeleting(): boolean {
    return this.deletingMediaId !== null;
  }

  get queuedCount(): number {
    return [...this.uploadJobs.values()].filter(job => job.status === 'queued')
      .length;
  }

  get uploadingCount(): number {
    return [...this.uploadJobs.values()].filter(
      job => job.status === 'uploading',
    ).length;
  }

  get hasActiveUploads(): boolean {
    return this.queuedCount > 0 || this.uploadingCount > 0;
  }

  get canUpload(): boolean {
    return (
      this.pendingFiles.some(file => this.canRetryUpload(file)) &&
      !this.isDeleting
    );
  }

  get dropzoneDisabled(): boolean {
    return this.isDeleting;
  }

  displayUrl(mediaId: number): string | null {
    return this.displayUrls.get(mediaId) ?? null;
  }

  loadGallery(): void {
    if (!this.productId) {
      return;
    }

    this.isLoading = true;
    this.productsService.getOne(this.productId).subscribe({
      next: product => {
        this.mediaItems = product.media ?? [];
        this.isLoading = false;
        this.loadDisplayUrls();
        this.emitMediaCount();
      },
      error: () => {
        this.isLoading = false;
        showError(
          this.messageService,
          'No se pudo cargar la galería del producto.',
        );
      },
    });
  }

  onDropzoneFiles(files: File[]): void {
    const previousKeys = new Set(
      this.pendingFiles.map(file => this.filePreviewKey(file)),
    );
    const added = files.filter(
      file => !previousKeys.has(this.filePreviewKey(file)),
    );

    this.pendingFiles = files;

    if (added.length > 0 && this.productId) {
      this.enqueueFiles(added);
    }
  }

  uploadPendingFiles(): void {
    const retryable = this.pendingFiles.filter(file => this.canRetryUpload(file));
    if (retryable.length === 0) {
      return;
    }

    this.enqueueFiles(retryable);
  }

  /**
   * Sube archivos pendientes del dropzone al servidor (requerido antes del sync WooCommerce).
   */
  uploadPendingIfAny(quiet = false): Observable<ProductMediaItem[]> {
    if (this.isDeleting) {
      return throwError(
        () => new Error('Espera a que termine la eliminación de imágenes.'),
      );
    }

    const pending = this.pendingFiles.filter(
      file =>
        !this.uploadJobs.has(this.filePreviewKey(file)) ||
        this.canRetryUpload(file),
    );

    if (pending.length === 0 && !this.hasActiveUploads) {
      return of([]);
    }

    this.enqueueFiles(pending);

    return new Observable<ProductMediaItem[]>(observer => {
      if (!this.hasActiveUploads && pending.length === 0) {
        observer.next([]);
        observer.complete();
        return;
      }

      this.queueWaiters.push({
        quiet,
        resolve: items => {
          observer.next(items);
          observer.complete();
        },
        reject: err => observer.error(err),
      });
    });
  }

  deleteImage(mediaId: number): void {
    if (this.deletingMediaId !== null) {
      return;
    }

    this.deletingMediaId = mediaId;

    this.productMediaService.deleteImage(this.productId, mediaId).subscribe({
      next: response => {
        this.deletingMediaId = null;

        notifyWooCommerceSyncResult(
          this.messageService,
          response.body?.wooCommerceSync,
          response.body?.message ?? 'Imagen eliminada correctamente.',
        );

        this.revokeDisplayUrl(mediaId);
        this.mediaItems = this.mediaItems.filter(item => item.id !== mediaId);
        this.emitMediaCount();
      },
      error: err => {
        this.deletingMediaId = null;
        showError(
          this.messageService,
          err?.error?.message ?? 'No se pudo eliminar la imagen.',
        );
      },
    });
  }

  isDeletingItem(mediaId: number): boolean {
    return this.deletingMediaId === mediaId;
  }

  bindDropzoneFileKey(file: File): string {
    return this.filePreviewKey(file);
  }

  bindDropzoneStatusLabel(file: File): string | null {
    switch (this.uploadJobs.get(this.filePreviewKey(file))?.status) {
      case 'queued':
        return 'En cola';
      case 'uploading':
        return 'Subiendo…';
      case 'error':
        return 'Error';
      default:
        return null;
    }
  }

  bindDropzoneStatusSeverity(
    file: File,
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    switch (this.uploadJobs.get(this.filePreviewKey(file))?.status) {
      case 'queued':
        return 'info';
      case 'uploading':
        return 'warning';
      case 'error':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  bindDropzoneStatusUploading(file: File): boolean {
    return this.uploadJobs.get(this.filePreviewKey(file))?.status === 'uploading';
  }

  private enqueueFiles(files: File[]): void {
    if (files.length === 0) {
      this.completeWaitersIfIdle();
      return;
    }

    for (const file of files) {
      const key = this.filePreviewKey(file);
      const existing = this.uploadJobs.get(key);

      if (existing?.status === 'uploading' || existing?.status === 'queued') {
        continue;
      }

      if (!this.localPreviewByKey.has(key)) {
        this.localPreviewByKey.set(key, URL.createObjectURL(file));
      }

      this.uploadJobs.set(key, { file, status: 'queued' });
      this.uploadQueue$.next(key);
    }
  }

  private processUploadJob(key: string): Observable<void> {
    const job = this.uploadJobs.get(key);
    if (!job || job.status !== 'queued') {
      return of(undefined);
    }

    job.status = 'uploading';

    return this.productMediaService.uploadImage(this.productId, job.file).pipe(
      tap((response: HttpResponse<ProductMediaUploadResponse>) => {
        job.status = 'done';
        job.media = response.body?.media;

        this.sessionWorstSync = this.mergeSyncResults(
          this.sessionWorstSync,
          response.body?.wooCommerceSync,
        );

        if (response.body?.media) {
          this.sessionUploaded.push(response.body.media);
          this.applyLocalPreview(response.body.media.id, key);

          const existingIds = new Set(this.mediaItems.map(item => item.id));
          if (!existingIds.has(response.body.media.id)) {
            this.mediaItems = [...this.mediaItems, response.body.media];
            this.emitMediaCount();
          }
        }
      }),
      catchError(err => {
        job.status = 'error';
        if (!this.queueWaiters.every(waiter => waiter.quiet)) {
          showError(
            this.messageService,
            err?.error?.message ??
              err?.message ??
              'No se pudo subir una imagen.',
          );
        }
        return EMPTY;
      }),
      finalize(() => {
        if (job.status === 'done') {
          this.uploadJobs.delete(key);
          this.pendingFiles = this.pendingFiles.filter(
            file => this.filePreviewKey(file) !== key,
          );
          this.mediaDropzone?.removeByKey(key);
          this.releaseLocalPreview(key);
        }

        this.completeWaitersIfIdle();
      }),
      map(() => undefined),
    );
  }

  private completeWaitersIfIdle(): void {
    if (this.hasActiveUploads) {
      return;
    }

    const uploaded = [...this.sessionUploaded];
    const worstSync = this.sessionWorstSync;
    const waiters = [...this.queueWaiters];
    const suppressToast =
      waiters.length > 0 && waiters.every(waiter => waiter.quiet);

    this.sessionUploaded = [];
    this.sessionWorstSync = undefined;
    this.queueWaiters = [];

    for (const waiter of waiters) {
      waiter.resolve(uploaded);
    }

    if (uploaded.length > 0 && !suppressToast) {
      const baseMessage =
        uploaded.length === 1
          ? 'Imagen subida correctamente.'
          : `${uploaded.length} imágenes subidas correctamente.`;
      notifyWooCommerceSyncResult(this.messageService, worstSync, baseMessage);
    }
  }

  private failWaiters(err: unknown): void {
    const waiters = [...this.queueWaiters];
    this.queueWaiters = [];
    for (const waiter of waiters) {
      waiter.reject(err);
    }
  }

  private canRetryUpload(file: File): boolean {
    const status = this.uploadJobs.get(this.filePreviewKey(file))?.status;
    return !status || status === 'error';
  }

  private resetUploadState(): void {
    this.uploadJobs.clear();
    this.revokeLocalPreviews();
    this.sessionUploaded = [];
    this.sessionWorstSync = undefined;
    this.queueWaiters = [];
  }

  private emitMediaCount(): void {
    this.mediaCountChange.emit(this.mediaItems.length);
  }

  private mergeSyncResults(
    current: WooCommerceSyncResult | undefined,
    next: WooCommerceSyncResult | undefined,
  ): WooCommerceSyncResult | undefined {
    if (!next) {
      return current;
    }
    if (!current) {
      return next;
    }

    const currentScore = this.syncSeverityScore(current);
    const nextScore = this.syncSeverityScore(next);

    return nextScore >= currentScore ? next : current;
  }

  private syncSeverityScore(sync: WooCommerceSyncResult): number {
    if (!sync.attempted) {
      return 3;
    }
    if (sync.errors > 0) {
      return 2;
    }
    if (sync.products < 1) {
      return 1;
    }

    return 0;
  }

  private loadDisplayUrls(): void {
    const activeIds = new Set(this.mediaItems.map(item => item.id));
    for (const mediaId of [...this.displayUrls.keys()]) {
      if (!activeIds.has(mediaId)) {
        this.revokeDisplayUrl(mediaId);
      }
    }

    this.loadDisplayUrlsForItems(
      this.mediaItems.filter(item => !this.displayUrls.has(item.id)),
    );
  }

  private loadDisplayUrlsForItems(items: ProductMediaItem[]): void {
    const pending = items.filter(item => !this.displayUrls.has(item.id));
    if (pending.length === 0) {
      return;
    }

    forkJoin(
      pending.map(item =>
        this.productMediaService
          .getPreviewBlob(this.productId, item.id)
          .pipe(
            tap(blob => {
              this.setDisplayUrl(item.id, blob);
            }),
          ),
      ),
    ).subscribe({
      error: () => {
        showError(
          this.messageService,
          'No se pudieron cargar una o más imágenes del producto.',
        );
      },
    });
  }

  private filePreviewKey(file: File): string {
    return `${file.name}:${file.size}:${file.lastModified}`;
  }

  private applyLocalPreview(mediaId: number, key: string): void {
    const localUrl = this.localPreviewByKey.get(key);
    if (!localUrl) {
      return;
    }

    this.revokeDisplayUrl(mediaId);
    this.displayUrls.set(mediaId, localUrl);
    this.localPreviewByKey.delete(key);
  }

  private releaseLocalPreview(key: string): void {
    const url = this.localPreviewByKey.get(key);
    if (url) {
      URL.revokeObjectURL(url);
      this.localPreviewByKey.delete(key);
    }
  }

  private revokeLocalPreviews(): void {
    for (const url of this.localPreviewByKey.values()) {
      URL.revokeObjectURL(url);
    }
    this.localPreviewByKey.clear();
  }

  private setDisplayUrl(mediaId: number, blob: Blob): void {
    const typedBlob =
      blob.type && blob.type.startsWith('image/')
        ? blob
        : new Blob([blob], { type: 'image/jpeg' });

    this.revokeDisplayUrl(mediaId);
    this.displayUrls.set(mediaId, URL.createObjectURL(typedBlob));
  }

  private revokeDisplayUrl(mediaId: number): void {
    const url = this.displayUrls.get(mediaId);
    if (url) {
      URL.revokeObjectURL(url);
      this.displayUrls.delete(mediaId);
    }
  }

  private revokeDisplayUrls(): void {
    for (const url of this.displayUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this.displayUrls.clear();
  }
}
