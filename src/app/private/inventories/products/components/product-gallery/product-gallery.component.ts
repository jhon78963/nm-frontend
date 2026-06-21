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
import { concatMap, finalize, forkJoin, from, map, Observable, of, tap, throwError, toArray } from 'rxjs';

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
  isUploading = false;
  deletingMediaId: number | null = null;

  readonly maxFileSizeMb = 5;
  readonly maxFiles = 10;
  readonly accept = 'image/jpeg,image/png,image/webp';
  readonly cameraCapture = 'environment';

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
      this.pendingFiles = [];
      this.mediaDropzone?.clear();
      this.loadGallery();
    }
  }

  ngOnDestroy(): void {
    this.revokeDisplayUrls();
  }

  get isDeleting(): boolean {
    return this.deletingMediaId !== null;
  }

  get canUpload(): boolean {
    return (
      this.pendingFiles.length > 0 && !this.isUploading && !this.isDeleting
    );
  }

  get hasPendingFiles(): boolean {
    return this.pendingFiles.length > 0;
  }

  get dropzoneDisabled(): boolean {
    return this.isUploading || this.isDeleting;
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
    const previousCount = this.pendingFiles.length;
    this.pendingFiles = files;

    if (files.length > previousCount && files.length > 0 && this.productId) {
      this.uploadPendingIfAny().subscribe({
        error: err => {
          showError(
            this.messageService,
            err?.error?.message ??
              err?.message ??
              'No se pudo subir la imagen.',
          );
          this.loadGallery();
        },
      });
    }
  }

  uploadPendingFiles(): void {
    this.uploadPendingIfAny().subscribe({
      error: err => {
        showError(
          this.messageService,
          err?.error?.message ?? err?.message ?? 'No se pudo subir la imagen.',
        );
        this.loadGallery();
      },
    });
  }

  /**
   * Sube archivos pendientes del dropzone al servidor (requerido antes del sync WooCommerce).
   */
  uploadPendingIfAny(quiet = false): Observable<ProductMediaItem[]> {
    if (this.pendingFiles.length === 0) {
      return of([]);
    }

    if (this.isUploading) {
      return throwError(() => new Error('Ya hay una subida de imágenes en curso.'));
    }

    if (this.isDeleting) {
      return throwError(() => new Error('Espera a que termine la eliminación de imágenes.'));
    }

    this.isUploading = true;
    let worstSync: WooCommerceSyncResult | undefined;
    const uploaded: ProductMediaItem[] = [];
    const localPreviewByKey = new Map<string, string>();
    for (const file of this.pendingFiles) {
      localPreviewByKey.set(this.filePreviewKey(file), URL.createObjectURL(file));
    }

    return from(this.pendingFiles).pipe(
      concatMap(file =>
        this.productMediaService.uploadImage(this.productId, file).pipe(
          tap((response: HttpResponse<ProductMediaUploadResponse>) => {
            worstSync = this.mergeSyncResults(
              worstSync,
              response.body?.wooCommerceSync,
            );
            if (response.body?.media) {
              uploaded.push(response.body.media);
              this.applyLocalPreview(
                response.body.media.id,
                localPreviewByKey.get(this.filePreviewKey(file)),
                localPreviewByKey,
                this.filePreviewKey(file),
              );
            }
          }),
        ),
      ),
      toArray(),
      tap(() => {
        this.pendingFiles = [];
        this.mediaDropzone?.clear();

        if (uploaded.length > 0) {
          const existingIds = new Set(this.mediaItems.map(m => m.id));
          const novel = uploaded.filter(m => !existingIds.has(m.id));
          this.mediaItems = [...this.mediaItems, ...novel];
          this.loadDisplayUrlsForItems(novel);
          this.emitMediaCount();
        } else {
          this.loadGallery();
        }

        if (!quiet && uploaded.length > 0) {
          const baseMessage =
            uploaded.length === 1
              ? 'Imagen subida correctamente.'
              : `${uploaded.length} imágenes subidas correctamente.`;
          notifyWooCommerceSyncResult(
            this.messageService,
            worstSync,
            baseMessage,
          );
        }
      }),
      finalize(() => {
        for (const url of localPreviewByKey.values()) {
          URL.revokeObjectURL(url);
        }
        this.isUploading = false;
      }),
      map(() => uploaded),
    );
  }

  deleteImage(mediaId: number): void {
    if (this.isUploading || this.deletingMediaId !== null) {
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

  private applyLocalPreview(
    mediaId: number,
    localUrl: string | undefined,
    localPreviewByKey: Map<string, string>,
    key: string,
  ): void {
    if (!localUrl) {
      return;
    }

    this.revokeDisplayUrl(mediaId);
    this.displayUrls.set(mediaId, localUrl);
    localPreviewByKey.delete(key);
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
