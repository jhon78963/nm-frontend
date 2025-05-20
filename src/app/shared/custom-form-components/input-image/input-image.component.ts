import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FileUploadModule } from 'primeng/fileupload';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { environment } from '../../../../environments/environment';
import { Image } from '../../models/images';

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
  ],
  templateUrl: './input-image.component.html',
  styleUrl: './input-image.component.scss',
})
export class InputImageComponent implements OnInit {
  apiUrl = environment.BASE_URL;
  uploadedFiles: Image[] = [];
  leftFiles: Image[] = [];
  selectedFile: Image | undefined;
  url: string = '';

  ngOnInit(): void {
    console.log('hola');
  }

  onUpload() {}
  removeImage(id: number) {
    console.log(id);
  }
  addImage(event: any) {
    console.log(event);
  }
}
