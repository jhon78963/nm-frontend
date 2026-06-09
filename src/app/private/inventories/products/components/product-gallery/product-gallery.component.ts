import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { concatMap, finalize, forkJoin, from, tap, toArray } from 'rxjs';

import { VoucherDropzoneComponent } from '../../../../shared/components/voucher-dropzone/voucher-dropzone.component';
import {
  showError,
  showSuccess,
  showToastWarn,
} from '../../../../../utils/notifications';
import {
  ProductMediaItem,
  ProductMediaUploadResponse,
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
    this.pendingFiles = files;
  }

  uploadPendingFiles(): void {
    if (!this.canUpload) {
      return;
    }

    this.isUploading = true;
    let hadSyncDelay = false;
    const uploaded: ProductMediaItem[] = [];

    from(this.pendingFiles)
      .pipe(
        concatMap(file =>
          this.productMediaService.uploadImage(this.productId, file).pipe(
            tap((response: HttpResponse<ProductMediaUploadResponse>) => {
              if (response.status === 207) {
                hadSyncDelay = true;
              }
              if (response.body?.media) {
                uploaded.push(response.body.media);
              }
            }),
          ),
        ),
        toArray(),
        finalize(() => {
          this.isUploading = false;
          this.pendingFiles = [];
          this.mediaDropzone?.clear();

          if (uploaded.length > 0) {
            const existingIds = new Set(this.mediaItems.map(m => m.id));
            const novel = uploaded.filter(m => !existingIds.has(m.id));
            this.mediaItems = [...this.mediaItems, ...novel];
            this.loadDisplayUrlsForItems(novel);
          }

          if (uploaded.length === 0) {
            this.loadGallery();
            return;
          }

          if (hadSyncDelay) {
            showToastWarn(
              this.messageService,
              'Imagen subida correctamente, pero hubo un retraso sincronizando con la tienda online.',
            );
          } else {
            showSuccess(
              this.messageService,
              uploaded.length === 1
                ? 'Imagen subida correctamente.'
                : `${uploaded.length} imágenes subidas correctamente.`,
            );
          }
        }),
      )
      .subscribe({
        error: err => {
          showError(
            this.messageService,
            err?.error?.message ?? 'No se pudo subir la imagen.',
          );
          this.loadGallery();
        },
      });
  }

  deleteImage(mediaId: number): void {
    if (this.isUploading || this.deletingMediaId !== null) {
      return;
    }

    this.deletingMediaId = mediaId;

    this.productMediaService.deleteImage(this.productId, mediaId).subscribe({
      next: response => {
        this.deletingMediaId = null;

        if (response.status === 207) {
          showToastWarn(
            this.messageService,
            'Imagen eliminada, pero hubo un retraso sincronizando con la tienda online.',
          );
        } else {
          showSuccess(
            this.messageService,
            response.body?.message ?? 'Imagen eliminada correctamente.',
          );
        }

        this.revokeDisplayUrl(mediaId);
        this.mediaItems = this.mediaItems.filter(item => item.id !== mediaId);
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

  private loadDisplayUrls(): void {
    this.revokeDisplayUrls();
    this.loadDisplayUrlsForItems(this.mediaItems);
  }

  private loadDisplayUrlsForItems(items: ProductMediaItem[]): void {
    if (items.length === 0) {
      return;
    }

    forkJoin(
      items.map(item =>
        this.productMediaService
          .getPreviewBlob(this.productId, item.id)
          .pipe(
            tap(blob => {
              this.displayUrls.set(item.id, URL.createObjectURL(blob));
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
