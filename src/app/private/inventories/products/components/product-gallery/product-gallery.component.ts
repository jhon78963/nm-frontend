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
import { TagModule } from 'primeng/tag';
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
import { showError, showSuccess } from '../../../../../utils/notifications';
import { notifyWooCommerceSyncResult } from '../../../../../utils/woo-commerce-sync-feedback';
import {
  ProductMediaItem,
  ProductMediaUploadResponse,
  WooCommerceSyncResult,
} from '../../models/product-media.model';
import { ProductMediaService } from '../../services/product-media.service';
import { ProductsService } from '../../services/products.service';

type UploadJobStatus = 'pending' | 'uploading' | 'error';

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
    TagModule,
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
  selectedQueueKey: string | null = null;

  isLoading = false;
  deletingMediaId: number | null = null;

  readonly maxFileSizeMb = 5;
  readonly maxFiles = 10;
  readonly accept = 'image/jpeg,image/png,image/webp';

  private readonly trackedFiles = new Map<string, TrackedFile>();
  private readonly fileKeyByRef = new Map<File, string>();
  private readonly localPreviewByKey = new Map<string, string>();
  private queueOrder: string[] = [];
  private queueWaiters: Array<{
    quiet: boolean;
    resolve: (items: ProductMediaItem[]) => void;
    reject: (err: unknown) => void;
  }> = [];
  private sessionUploaded: ProductMediaItem[] = [];
  private sessionWorstSync: WooCommerceSyncResult | undefined;
  private isPumpingQueue = false;
  private suppressErrorToast = false;
  private autoDrainAfterUpload = false;

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

  get queueItems(): TrackedFile[] {
    return this.queueOrder
      .map(key => this.trackedFiles.get(key))
      .filter((item): item is TrackedFile => !!item);
  }

  get pendingCount(): number {
    return this.countByStatus('pending');
  }

  get uploadingCount(): number {
    return this.countByStatus('uploading');
  }

  get failedCount(): number {
    return this.countByStatus('error');
  }

  get isUploading(): boolean {
    return this.uploadingCount > 0 || this.isPumpingQueue;
  }

  get canUploadNext(): boolean {
    return !!this.nextUploadKey() && !this.isUploading && !this.isDeleting;
  }

  get canRetryFailed(): boolean {
    return this.failedCount > 0 && !this.isUploading && !this.isDeleting;
  }

  get clearQueueCount(): number {
    return this.queueItems.length;
  }

  get canClearQueue(): boolean {
    return this.clearQueueCount > 0 && !this.isUploading && !this.isDeleting;
  }

  get dropzoneDisabled(): boolean {
    return this.isDeleting || this.isUploading;
  }

  get nextUploadLabel(): string {
    const key = this.nextUploadKey();
    if (!key) {
      return 'Subir siguiente';
    }

    const index = this.queueOrder.indexOf(key) + 1;
    return `Subir siguiente (${index}/${this.queueItems.length})`;
  }

  displayUrl(mediaId: number): string | null {
    return this.displayUrls.get(mediaId) ?? null;
  }

  queuePreviewUrl(key: string): string | null {
    return this.localPreviewByKey.get(key) ?? null;
  }

  isQueueSelected(key: string): boolean {
    return (this.selectedQueueKey ?? this.nextUploadKey()) === key;
  }

  queueStatusLabel(item: TrackedFile): string {
    switch (item.status) {
      case 'pending':
        return this.isQueueSelected(item.key) ? 'Siguiente' : 'Pendiente';
      case 'uploading':
        return 'Subiendo…';
      case 'error':
        return 'Error';
    }
  }

  queueStatusSeverity(
    item: TrackedFile,
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    switch (item.status) {
      case 'pending':
        return this.isQueueSelected(item.key) ? 'info' : 'secondary';
      case 'uploading':
        return 'warning';
      case 'error':
        return 'danger';
    }
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
        this.queueOrder.push(key);
        this.ensureQueuePreview(key, file);
      }
    }

    this.pendingFiles = files;
    this.pruneRemovedPending(activeKeys);
    this.ensureSelectedQueueKey();
  }

  selectQueueItem(key: string): void {
    const item = this.trackedFiles.get(key);
    if (!item || item.status === 'uploading') {
      return;
    }

    if (item.status === 'error') {
      item.status = 'pending';
    }

    this.selectedQueueKey = key;
    this.moveQueueKeyToFront(key);
  }

  moveQueueItem(key: string, delta: number, event?: Event): void {
    event?.stopPropagation();

    const item = this.trackedFiles.get(key);
    if (!item || item.status === 'uploading') {
      return;
    }

    const index = this.queueOrder.indexOf(key);
    if (index < 0) {
      return;
    }

    const target = index + delta;
    if (target < 0 || target >= this.queueOrder.length) {
      return;
    }

    this.queueOrder[index] = this.queueOrder[target];
    this.queueOrder[target] = key;
  }

  uploadNext(): void {
    this.autoDrainAfterUpload = false;
    this.uploadOne(this.nextUploadKey(), false);
  }

  uploadQueueItem(key: string, event?: Event): void {
    event?.stopPropagation();
    this.autoDrainAfterUpload = false;
    this.selectedQueueKey = key;

    const item = this.trackedFiles.get(key);
    if (item?.status === 'error') {
      item.status = 'pending';
    }

    this.moveQueueKeyToFront(key);
    this.uploadOne(key, false);
  }

  retryFailedUploads(): void {
    const failed = this.queueItems.find(item => item.status === 'error');
    if (!failed) {
      return;
    }

    failed.status = 'pending';
    this.selectedQueueKey = failed.key;
    this.moveQueueKeyToFront(failed.key);
    this.autoDrainAfterUpload = false;
    this.uploadOne(failed.key, false);
  }

  clearQueue(): void {
    if (!this.canClearQueue) {
      return;
    }

    const uploaded = [...this.sessionUploaded];
    const waiters = [...this.queueWaiters];

    this.isPumpingQueue = false;
    this.autoDrainAfterUpload = false;
    this.trackedFiles.clear();
    this.fileKeyByRef.clear();
    this.queueOrder = [];
    this.selectedQueueKey = null;
    this.revokeLocalPreviews();
    this.pendingFiles = [];
    this.mediaDropzone?.clear();
    this.sessionUploaded = [];
    this.sessionWorstSync = undefined;
    this.suppressErrorToast = false;
    this.queueWaiters = [];

    for (const waiter of waiters) {
      waiter.resolve(uploaded);
    }

    showSuccess(this.messageService, 'Cola de imágenes limpiada.');
  }

  uploadPendingIfAny(quiet = false): Observable<ProductMediaItem[]> {
    if (this.isDeleting) {
      return throwError(
        () => new Error('Espera a que termine la eliminación de imágenes.'),
      );
    }

    const needsUpload = this.queueItems.some(
      item => item.status === 'pending' || item.status === 'error',
    );

    if (!needsUpload && !this.isUploading) {
      return of([]);
    }

    this.autoDrainAfterUpload = true;
    this.suppressErrorToast = quiet;
    this.uploadOne(this.nextUploadKey(), quiet);

    return new Observable<ProductMediaItem[]>(observer => {
      if (!this.isUploading && !needsUpload) {
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
    const item = this.trackedFiles.get(this.ensureFileKey(file));
    return item ? this.queueStatusLabel(item) : null;
  }

  bindDropzoneStatusSeverity(
    file: File,
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const item = this.trackedFiles.get(this.ensureFileKey(file));
    return item ? this.queueStatusSeverity(item) : 'secondary';
  }

  bindDropzoneStatusUploading(file: File): boolean {
    return (
      this.trackedFiles.get(this.ensureFileKey(file))?.status === 'uploading'
    );
  }

  private uploadOne(key: string | null, quiet: boolean): void {
    if (!key || this.isPumpingQueue) {
      this.completeWaitersIfIdle();
      return;
    }

    const tracked = this.trackedFiles.get(key);
    if (
      !tracked ||
      (tracked.status !== 'pending' && tracked.status !== 'error')
    ) {
      if (this.autoDrainAfterUpload) {
        this.uploadOne(this.nextUploadKey(), quiet);
      } else {
        this.completeWaitersIfIdle();
      }
      return;
    }

    this.suppressErrorToast = quiet;
    this.isPumpingQueue = true;
    tracked.status = 'uploading';
    this.ensureQueuePreview(key, tracked.file);

    this.productMediaService
      .uploadImage(this.productId, tracked.file)
      .pipe(
        tap((response: HttpResponse<ProductMediaUploadResponse>) => {
          if (!this.trackedFiles.has(key)) {
            return;
          }

          tracked.media = response.body?.media;

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
          if (!this.trackedFiles.has(key)) {
            return EMPTY;
          }

          tracked.status = 'error';
          if (!this.suppressErrorToast) {
            showError(
              this.messageService,
              err?.error?.message ??
                err?.message ??
                'No se pudo subir la imagen.',
            );
          }
          return EMPTY;
        }),
        finalize(() => {
          this.isPumpingQueue = false;

          if (this.trackedFiles.has(key) && tracked.status !== 'error') {
            this.removeFromQueue(key);
          }

          if (this.autoDrainAfterUpload) {
            const nextKey = this.nextUploadKey();
            if (nextKey) {
              this.uploadOne(nextKey, quiet);
              return;
            }
          }

          this.completeWaitersIfIdle();
        }),
      )
      .subscribe();
  }

  private removeFromQueue(key: string): void {
    const tracked = this.trackedFiles.get(key);
    if (!tracked) {
      return;
    }

    this.trackedFiles.delete(key);
    this.fileKeyByRef.delete(tracked.file);
    this.queueOrder = this.queueOrder.filter(itemKey => itemKey !== key);
    this.pendingFiles = this.pendingFiles.filter(
      file => this.fileKeyByRef.get(file) !== key,
    );
    this.mediaDropzone?.removeByKey(key);

    if (this.selectedQueueKey === key) {
      this.selectedQueueKey = null;
    }

    this.ensureSelectedQueueKey();
  }

  private nextUploadKey(): string | null {
    if (this.selectedQueueKey) {
      const selected = this.trackedFiles.get(this.selectedQueueKey);
      if (
        selected &&
        (selected.status === 'pending' || selected.status === 'error')
      ) {
        return this.selectedQueueKey;
      }
    }

    return (
      this.queueOrder.find(itemKey => {
        const item = this.trackedFiles.get(itemKey);
        return item?.status === 'pending' || item?.status === 'error';
      }) ?? null
    );
  }

  private moveQueueKeyToFront(key: string): void {
    this.queueOrder = [key, ...this.queueOrder.filter(itemKey => itemKey !== key)];
  }

  private ensureSelectedQueueKey(): void {
    if (
      this.selectedQueueKey &&
      this.trackedFiles.has(this.selectedQueueKey)
    ) {
      return;
    }

    this.selectedQueueKey = this.nextUploadKey();
  }

  private ensureQueuePreview(key: string, file: File): void {
    if (!this.localPreviewByKey.has(key)) {
      this.localPreviewByKey.set(key, URL.createObjectURL(file));
    }
  }

  private completeWaitersIfIdle(): void {
    if (this.isUploading) {
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
    this.autoDrainAfterUpload = false;
    this.queueWaiters = [];

    for (const waiter of waiters) {
      waiter.resolve(uploaded);
    }

    if (uploaded.length > 0 && !suppressToast && !this.autoDrainAfterUpload) {
      notifyWooCommerceSyncResult(
        this.messageService,
        worstSync,
        uploaded.length === 1
          ? 'Imagen subida correctamente.'
          : `${uploaded.length} imágenes subidas correctamente.`,
      );
    }
  }

  private pruneRemovedPending(activeKeys: Set<string>): void {
    for (const key of [...this.queueOrder]) {
      const tracked = this.trackedFiles.get(key);
      if (!tracked) {
        continue;
      }

      if (
        activeKeys.has(key) ||
        tracked.status === 'uploading'
      ) {
        continue;
      }

      this.trackedFiles.delete(key);
      this.fileKeyByRef.delete(tracked.file);
      this.queueOrder = this.queueOrder.filter(itemKey => itemKey !== key);
      this.releaseLocalPreview(key);

      if (this.selectedQueueKey === key) {
        this.selectedQueueKey = null;
      }
    }

    this.ensureSelectedQueueKey();
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
    this.queueOrder = [];
    this.selectedQueueKey = null;
    this.revokeLocalPreviews();
    this.sessionUploaded = [];
    this.sessionWorstSync = undefined;
    this.queueWaiters = [];
    this.isPumpingQueue = false;
    this.suppressErrorToast = false;
    this.autoDrainAfterUpload = false;
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
