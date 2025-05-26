import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FileUploadModule } from 'primeng/fileupload';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { environment } from '../../../../environments/environment';
import { ButtonModule } from 'primeng/button';
import { getFileSize } from '../../../utils/files';
import { BASE_S3_URL } from '../../../utils/constants';

export interface InputImage {
  images: File | File[];
  multiply: boolean;
}

@Component({
  selector: 'app-input-image',
  standalone: true,
  imports: [
    CommonModule,
    FileUploadModule,
    FormsModule,
    OverlayPanelModule,
    TableModule,
    ToastModule,
    TooltipModule,
    ButtonModule,
  ],
  templateUrl: './input-image.component.html',
  styleUrl: './input-image.component.scss',
})
export class InputImageComponent implements OnInit, OnChanges {
  @Output()
  public selectedFilesChange: EventEmitter<InputImage> = new EventEmitter();
  apiUrl = environment.BASE_URL;
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  isDragging = false;
  @Input() productId: number = 0;
  @Input() images: any[] = [];
  s3_url: string = BASE_S3_URL;

  ngOnInit(): void {
    console.log(this.productId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images']) {
      console.log('Imágenes recibidas:', this.images);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(input.files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files) {
      this.addFiles(event.dataTransfer.files);
    }
  }

  private addFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.selectedFiles.push(file);
      const blobUrl = URL.createObjectURL(file);
      this.imagePreviews.push(blobUrl);
    }
  }

  uploadFiles(): void {
    // const formData = new FormData();
    // this.selectedFiles.forEach((file: File) => {
    //   formData.append('image[]', file);
    // });
    this.selectedFilesChange.emit({
      images: this.selectedFiles,
      multiply: true,
    });

    // this.fileService.createImage(formData).subscribe({
    //   next: (resp: any) => {
    //     if (resp.image) {
    //       this.fileService.saveImage(this.productId, resp.image).subscribe();
    //     }
    //   },
    //   error: () => {
    //     console.error('Error al subir');
    //   },
    // });
  }

  uploadFile(file: File) {
    // const formData = new FormData();
    // formData.append('image', file);
    this.selectedFilesChange.emit({ images: file, multiply: false });
  }

  clearFiles(): void {
    this.imagePreviews.forEach(url => URL.revokeObjectURL(url));
    this.selectedFiles = [];
    this.imagePreviews = [];

    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  getFileSize(bytes: number): string {
    return getFileSize(bytes);
  }

  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  removeFile(index: number): void {
    URL.revokeObjectURL(this.imagePreviews[index]);
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);

    if (this.selectedFiles.length === 0) {
      const input = document.getElementById('fileInput') as HTMLInputElement;
      if (input) input.value = '';
    }
  }
}
