import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  SimpleChanges,
  OnChanges,
  output,
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
  @Input() productId: number = 0;
  @Input() images: any[] = [];
  @Input() imageSaved: any;
  @Input() imagesSaved: any;
  selectedFilesChange = output<InputImage>();
  imagesToDelete = output<any>();
  index: number = 0;
  newImageIndexes: any[] = [];
  newImages: any[] = [];
  apiUrl = environment.BASE_URL;
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  isDragging = false;
  s3_url: string = BASE_S3_URL;

  ngOnInit(): void {
    console.log(this.productId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageSaved'] && this.imageSaved) {
      this.images[this.index].size = this.imageSaved.size;
      this.images[this.index].path = this.imageSaved.image;
      delete this.images[this.index].preview;
      this.index = 0;
    }
    if (changes['imagesSaved'] && this.imagesSaved) {
      this.newImages = this.imagesSaved.images.map(
        (image: any, index: number) => ({
          path: image,
          size: this.imagesSaved.sizes[index],
          name: this.imagesSaved.names[index],
          isDB: true,
        }),
      );
      this.newImageIndexes.forEach((imageIndex, i) => {
        this.images[imageIndex] = this.newImages[i];
      });
      this.newImageIndexes = [];
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(input.files);
      input.value = '';
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

  uploadFiles(): void {
    this.newImageIndexes = [];
    this.newImages = [];
    this.images.forEach((image, index) => {
      if (!image.isDB) {
        this.newImageIndexes.push(index);
        this.newImages.push(image);
      }
    });
    const imagesToSave = this.newImages.map(image => image.file);
    this.selectedFilesChange.emit({
      images: imagesToSave,
      multiply: true,
    });
    this.newImages.forEach(image => {
      image.isDB = true;
    });
  }

  uploadFile(image: any, index: number) {
    this.index = 0;
    this.selectedFilesChange.emit({ images: image.file, multiply: false });
    this.images[index].isDB = true;
    this.index = index;
  }

  clearFiles(): void {
    const imagesToDelete = this.images
      .filter(p => p.isDB === true)
      .map(p => p.path);

    this.imagesToDelete.emit({
      images: imagesToDelete,
      multiply: true,
    });
    this.imagePreviews.forEach(url => URL.revokeObjectURL(url));
    this.images = [];
    this.selectedFiles = [];
    this.imagePreviews = [];

    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  clearFile(index: number): void {
    if (this.images[index].isDB) {
      this.imagesToDelete.emit({
        images: this.images[index].path,
        multiply: false,
      });
    }
    URL.revokeObjectURL(this.imagePreviews[index]);
    this.images.splice(index, 1);
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
    if (this.images.length === 0) {
      const input = document.getElementById('fileInput') as HTMLInputElement;
      if (input) input.value = '';
    }
  }

  getFileSize(bytes: number): string {
    return getFileSize(bytes);
  }

  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  private addFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Verificar si ya fue agregado
      const alreadyAdded = this.selectedFiles.some(
        f => f.name === file.name && f.size === file.size,
      );

      if (alreadyAdded) {
        alert(`El archivo "${file.name}" ya fue agregado.`);
        continue;
      }

      this.selectedFiles.push(file);
      const blobUrl = URL.createObjectURL(file);
      this.imagePreviews.push(blobUrl);

      this.images.push({
        name: file.name,
        size: file.size,
        file,
        preview: blobUrl,
        isDB: false,
      });
    }
  }
}
