import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-voucher-dropzone',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, TooltipModule],
  template: `
    @if (splitPickers) {
      <div class="flex flex-column gap-2">
        <div
          class="voucher-dropzone border-2 border-dashed border-round-xl p-3 text-center transition-colors transition-duration-150"
          [class.drag-over]="isDragOver"
          [class.cursor-pointer]="!disabled"
          [class.opacity-60]="disabled"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave()"
          (drop)="onDrop($event)"
          (click)="!disabled && galleryInput.click()">
          <i class="pi pi-images text-3xl text-400 mb-2 block"></i>
          <p class="m-0 text-600 text-sm">
            Toca para elegir
            <span class="text-primary font-semibold">varias imágenes</span>
            de la galería
          </p>
          <p class="m-0 mt-1 text-400 text-xs">
            {{ formatsHint }} · máx. {{ maxFileSizeMb }} MB c/u · hasta
            {{ maxFiles }} archivos
          </p>
          <input
            #galleryInput
            type="file"
            [multiple]="multiple"
            [accept]="accept"
            [disabled]="disabled"
            style="display:none"
            (change)="onFileInputChange($event)" />
        </div>

        <button
          pButton
          type="button"
          label="Tomar otra foto"
          icon="pi pi-camera"
          class="p-button-outlined w-full"
          [disabled]="disabled || files.length >= maxFiles"
          (click)="cameraInput.click()"></button>
        <p class="m-0 text-400 text-xs text-center">
          Puedes tomar varias fotos seguidas; luego pulsa «Subir cola» en la galería.
        </p>
        <input
          #cameraInput
          type="file"
          [accept]="accept"
          capture="environment"
          [disabled]="disabled"
          style="display:none"
          (change)="onFileInputChange($event)" />
      </div>
    } @else {
      <!-- Drop zone -->
      <div
        class="voucher-dropzone border-2 border-dashed border-round-xl p-3 text-center transition-colors transition-duration-150"
        [class.drag-over]="isDragOver"
        [class.cursor-pointer]="!disabled"
        [class.opacity-60]="disabled"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave()"
        (drop)="onDrop($event)"
        (click)="!disabled && fileInput.click()">
        <i class="pi pi-cloud-upload text-3xl text-400 mb-2 block"></i>
        <p class="m-0 text-600 text-sm">
          Arrastra aquí tus {{ subjectLabel }} o
          <span class="text-primary font-semibold">selecciona archivos</span>
        </p>
        <p class="m-0 mt-1 text-400 text-xs">
          {{ formatsHint }} · máx. {{ maxFileSizeMb }} MB c/u · hasta
          {{ maxFiles }} archivos
        </p>
        <input
          #fileInput
          type="file"
          [multiple]="multiple"
          [accept]="accept"
          [attr.capture]="capture"
          [disabled]="disabled"
          style="display:none"
          (change)="onFileInputChange($event)" />
      </div>
    }

    <!-- Lista de archivos seleccionados -->
    @if (files.length > 0) {
      <ul class="list-none p-0 m-0 mt-2 flex flex-column gap-1">
        @for (file of files; track fileKey(file); let i = $index) {
          <li
            class="flex align-items-center justify-content-between gap-2 surface-50 border-round p-2 text-sm">
            <div class="flex align-items-center gap-2 min-w-0">
              <i
                [class]="
                  file.type === 'application/pdf'
                    ? 'pi pi-file-pdf text-red-500'
                    : 'pi pi-image text-blue-500'
                "></i>
              <span
                class="white-space-nowrap overflow-hidden text-overflow-ellipsis text-900">
                {{ file.name }}
              </span>
              @if (statusLabel(file); as status) {
                <p-tag
                  [value]="status"
                  [severity]="statusSeverity(file)"
                  styleClass="text-xs flex-shrink-0"></p-tag>
              } @else {
                <p-tag
                  [value]="formatSize(file.size)"
                  severity="secondary"
                  styleClass="text-xs flex-shrink-0"></p-tag>
              }
            </div>
            <button
              pButton
              type="button"
              icon="pi pi-times"
              class="p-button-text p-button-sm p-button-danger flex-shrink-0"
              pTooltip="Quitar"
              tooltipPosition="left"
              [disabled]="disabled || isFileUploading(file)"
              (click)="removeFile(i)"></button>
          </li>
        }
      </ul>
    }
  `,
  styles: [
    `
      .voucher-dropzone {
        border-color: var(--surface-border);
        background: var(--surface-ground);
      }
      .voucher-dropzone:hover,
      .voucher-dropzone.drag-over {
        border-color: var(--primary-color);
        background: var(--primary-50, #f0f7ff);
      }
    `,
  ],
})
export class VoucherDropzoneComponent implements OnDestroy {
  @Input() maxFiles = 10;
  @Input() maxFileSizeMb = 5;
  @Input() accept = 'image/*,application/pdf';
  @Input() multiple = true;
  @Input() disabled = false;
  @Input() subjectLabel = 'comprobantes';
  @Input() formatsHint = 'PDF o imagen';
  /** En móvil: galería múltiple + botón de cámara para tomar varias fotos seguidas. */
  @Input() splitPickers = false;
  /** Atributo HTML capture (p. ej. "environment" para cámara trasera en móvil). */
  @Input() capture: string | null = null;
  /** Etiqueta de estado por archivo (p. ej. "En cola", "Subiendo…"). */
  @Input() fileStatusLabel: ((file: File) => string | null) | null = null;
  @Input() fileStatusSeverity:
    | ((file: File) => 'success' | 'info' | 'warning' | 'danger' | 'secondary')
    | null = null;
  @Input() fileStatusUploading: ((file: File) => boolean) | null = null;
  @Input() fileKeyFn: ((file: File) => string) | null = null;

  /** Los archivos seleccionados actualmente */
  @Output() filesChange = new EventEmitter<File[]>();

  files: File[] = [];
  isDragOver = false;

  fileKey(file: File): string {
    return this.fileKeyFn?.(file) ?? `${file.name}:${file.size}:${file.lastModified}`;
  }

  statusLabel(file: File): string | null {
    return this.fileStatusLabel?.(file) ?? null;
  }

  statusSeverity(
    file: File,
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    return this.fileStatusSeverity?.(file) ?? 'secondary';
  }

  isFileUploading(file: File): boolean {
    return this.fileStatusUploading?.(file) ?? false;
  }

  private get maxBytes(): number {
    return this.maxFileSizeMb * 1024 * 1024;
  }

  onDragOver(event: DragEvent): void {
    if (this.disabled) {
      return;
    }
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    if (this.disabled) {
      return;
    }
    event.preventDefault();
    this.isDragOver = false;
    const items = event.dataTransfer?.files;
    if (items) {
      this.addFiles(Array.from(items));
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
    input.value = '';
  }

  removeFile(index: number): void {
    this.files = this.files.filter((_, i) => i !== index);
    this.filesChange.emit(this.files);
  }

  clear(): void {
    this.files = [];
    this.filesChange.emit(this.files);
  }

  removeByKey(key: string): void {
    this.files = this.files.filter(file => this.fileKey(file) !== key);
    this.filesChange.emit(this.files);
  }

  ngOnDestroy(): void {
    this.files = [];
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private addFiles(incoming: File[]): void {
    const valid = incoming.filter(f => f.size <= this.maxBytes);
    const merged = [...this.files, ...valid].slice(0, this.maxFiles);
    this.files = merged;
    this.filesChange.emit(this.files);
  }
}
