import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { MessageService } from 'primeng/api';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';

interface Image {
  name: string;
  objectURL: string;
}

@Component({
  selector: 'app-upload-excel',
  templateUrl: './upload-excel.component.html',
  styleUrl: './upload-excel.component.scss',
  standalone: true,
  imports: [CommonModule, ToastModule, FileUploadModule],
  providers: [MessageService],
})
export class UploadExcelComponent {
  @Output()
  newUploadedFiles: EventEmitter<any[]> = new EventEmitter<any[]>();
  uploadedFiles: any[] = [];

  @ViewChildren('buttonEl') buttonEl!: QueryList<ElementRef>;

  constructor(private messageService: MessageService) {}

  onUpload(event: any) {
    for (const file of event.files) {
      this.uploadedFiles.push(file);
    }

    this.newUploadedFiles.emit(this.uploadedFiles);

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'File uploaded successfully',
    });
  }

  onImageMouseOver(file: Image) {
    this.buttonEl.toArray().forEach(el => {
      el.nativeElement.id === file.name
        ? (el.nativeElement.style.display = 'flex')
        : null;
    });
  }

  onImageMouseLeave(file: Image) {
    this.buttonEl.toArray().forEach(el => {
      el.nativeElement.id === file.name
        ? (el.nativeElement.style.display = 'none')
        : null;
    });
  }

  removeImage(event: Event, file: any) {
    event.stopPropagation();
    this.uploadedFiles = this.uploadedFiles.filter(i => i !== file);
  }
}
