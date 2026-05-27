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
    <!-- Drop zone -->
    <div
      class="voucher-dropzone border-2 border-dashed border-round-xl p-3 text-center cursor-pointer transition-colors transition-duration-150"
      [class.drag-over]="isDragOver"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave()"
      (drop)="onDrop($event)"
      (click)="fileInput.click()">
      <i class="pi pi-cloud-upload text-3xl text-400 mb-2 block"></i>
      <p class="m-0 text-600 text-sm">
        Arrastra aquí tus comprobantes o
        <span class="text-primary font-semibold">selecciona archivos</span>
      </p>
      <p class="m-0 mt-1 text-400 text-xs">
        PDF o imagen · máx. {{ maxFileSizeMb }} MB c/u · hasta
        {{ maxFiles }} archivos
      </p>
      <input
        #fileInput
        type="file"
        [multiple]="true"
        [accept]="accept"
        style="display:none"
        (change)="onFileInputChange($event)" />
    </div>

    <!-- Lista de archivos seleccionados -->
    @if (files.length > 0) {
      <ul class="list-none p-0 m-0 mt-2 flex flex-column gap-1">
        @for (file of files; track file.name + file.size; let i = $index) {
          <li
            class="flex align-items-center justify-content-between gap-2 surface-50 border-round p-2 text-sm">
            <div class="flex align-items-center gap-2 min-w-0">
              <i
                [class]="
                  file.type === 'application/pdf'
                    ? 'pi pi-file-pdf text-red-500'
                    : 'pi pi-image text-blue-500'
                "></i>
              <span class="white-space-nowrap overflow-hidden text-overflow-ellipsis text-900">
                {{ file.name }}
              </span>
              <p-tag
                [value]="formatSize(file.size)"
                severity="secondary"
                styleClass="text-xs flex-shrink-0"></p-tag>
            </div>
            <button
              pButton
              type="button"
              icon="pi pi-times"
              class="p-button-text p-button-sm p-button-danger flex-shrink-0"
              pTooltip="Quitar"
              tooltipPosition="left"
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

  /** Los archivos seleccionados actualmente */
  @Output() filesChange = new EventEmitter<File[]>();

  files: File[] = [];
  isDragOver = false;

  private get maxBytes(): number {
    return this.maxFileSizeMb * 1024 * 1024;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
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
