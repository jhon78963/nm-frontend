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
  EMPTY,
  finalize,
  forkJoin,
  Observable,
  of,
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

type UploadJobStatus = 'pending' | 'queued' | 'uploading' | 'done' | 'error';

interface TrackedFile {
  key: string;
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

  private readonly trackedFiles = new Map<string, TrackedFile>();
  private readonly fileKeyByRef = new Map<File, string>();
  private readonly localPreviewByKey = new Map<string, string>();
  private queueWaiters: Array<{
    quiet: boolean;
    resolve: (items: ProductMediaItem[]) => void;
    reject: (err: unknown) => void;
  }> = [];
  private sessionUploaded: ProductMediaItem[] = [];
  private sessionWorstSync: WooCommerceSyncResult | undefined;
  private isPumpingQueue = false;
  private suppressErrorToast = false;

  constructor(
    private readonly productsService: ProductsService,
    private readonly productMediaService: ProductMediaService,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadGallery();
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

  get pendingCount(): number {
    return this.countByStatus('pending');
  }

  get queuedCount(): number {
    return this.countByStatus('queued');
  }

  get uploadingCount(): number {
    return this.countByStatus('uploading');
  }

  get failedCount(): number {
    return this.countByStatus('error');
  }

  get hasActiveUploads(): boolean {
    return this.queuedCount > 0 || this.uploadingCount > 0;
  }

  get canStartQueue(): boolean {
    return this.pendingCount > 0 && !this.hasActiveUploads && !this.isDeleting;
  }

  get canRetryFailed(): boolean {
    return this.failedCount > 0 && !this.hasActiveUploads && !this.isDeleting;
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
    const activeKeys = new Set<string>();

    for (const file of files) {
      const key = this.ensureFileKey(file);
      activeKeys.add(key);

      if (!this.trackedFiles.has(key)) {
        this.trackedFiles.set(key, { key, file, status: 'pending' });
      }
    }

    this.pendingFiles = files;
    this.pruneRemovedPending(activeKeys);
  }

  startQueueUpload(): void {
    this.enqueuePending(false);
  }

  retryFailedUploads(): void {
    for (const tracked of this.trackedFiles.values()) {
      if (tracked.status === 'error') {
        tracked.status = 'pending';
      }
    }

    this.enqueuePending(false);
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

    const needsUpload = this.pendingFiles.some(file => {
      const status = this.trackedFiles.get(this.ensureFileKey(file))?.status;
      return !status || status === 'pending' || status === 'error';
    });

    if (!needsUpload && !this.hasActiveUploads) {
      return of([]);
    }

    this.enqueuePending(quiet);

    return new Observable<ProductMediaItem[]>(observer => {
      if (!this.hasActiveUploads && !needsUpload) {
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
    return this.ensureFileKey(file);
  }

  bindDropzoneStatusLabel(file: File): string | null {
    switch (this.trackedFiles.get(this.ensureFileKey(file))?.status) {
      case 'pending':
        return 'Pendiente';
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
    switch (this.trackedFiles.get(this.ensureFileKey(file))?.status) {
      case 'pending':
        return 'secondary';
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
    return (
      this.trackedFiles.get(this.ensureFileKey(file))?.status === 'uploading'
    );
  }

  private enqueuePending(quiet: boolean): void {
    this.suppressErrorToast = quiet;

    for (const tracked of this.trackedFiles.values()) {
      if (tracked.status === 'pending' || tracked.status === 'error') {
        tracked.status = 'queued';
      }
    }

    this.pumpQueue();
  }

  private pumpQueue(): void {
    if (this.isPumpingQueue) {
      return;
    }

    const next = [...this.trackedFiles.values()].find(
      tracked => tracked.status === 'queued',
    );

    if (!next) {
      this.completeWaitersIfIdle();
      return;
    }

    this.isPumpingQueue = true;
    next.status = 'uploading';

    const key = next.key;
    if (!this.localPreviewByKey.has(key)) {
      this.localPreviewByKey.set(key, URL.createObjectURL(next.file));
    }

    this.productMediaService
      .uploadImage(this.productId, next.file)
      .pipe(
        tap((response: HttpResponse<ProductMediaUploadResponse>) => {
          next.status = 'done';
          next.media = response.body?.media;

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
          next.status = 'error';
          if (!this.suppressErrorToast) {
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
          this.isPumpingQueue = false;

          if (next.status === 'done') {
            this.trackedFiles.delete(key);
            this.pendingFiles = this.pendingFiles.filter(
              file => this.fileKeyByRef.get(file) !== key,
            );
            this.fileKeyByRef.delete(next.file);
            this.mediaDropzone?.removeByKey(key);
          }

          this.pumpQueue();
        }),
      )
      .subscribe();
  }

  private completeWaitersIfIdle(): void {
    if (this.hasActiveUploads || this.isPumpingQueue) {
      return;
    }

    const uploaded = [...this.sessionUploaded];
    const worstSync = this.sessionWorstSync;
    const waiters = [...this.queueWaiters];
    const suppressToast =
      this.suppressErrorToast ||
      (waiters.length > 0 && waiters.every(waiter => waiter.quiet));

    this.sessionUploaded = [];
    this.sessionWorstSync = undefined;
    this.suppressErrorToast = false;
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

  private pruneRemovedPending(activeKeys: Set<string>): void {
    for (const [key, tracked] of this.trackedFiles) {
      if (
        activeKeys.has(key) ||
        tracked.status === 'queued' ||
        tracked.status === 'uploading'
      ) {
        continue;
      }

      this.trackedFiles.delete(key);
      this.fileKeyByRef.delete(tracked.file);
      this.releaseLocalPreview(key);
    }
  }

  private ensureFileKey(file: File): string {
    const existing = this.fileKeyByRef.get(file);
    if (existing) {
      return existing;
    }

    const key =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    this.fileKeyByRef.set(file, key);
    return key;
  }

  private countByStatus(status: UploadJobStatus): number {
    return [...this.trackedFiles.values()].filter(
      tracked => tracked.status === status,
    ).length;
  }

  private resetUploadState(): void {
    this.trackedFiles.clear();
    this.fileKeyByRef.clear();
    this.revokeLocalPreviews();
    this.sessionUploaded = [];
    this.sessionWorstSync = undefined;
    this.queueWaiters = [];
    this.isPumpingQueue = false;
    this.suppressErrorToast = false;
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
