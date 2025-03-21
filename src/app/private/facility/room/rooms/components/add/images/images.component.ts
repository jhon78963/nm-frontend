import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { RoomImagesService } from '../../../services/room-images.service';
import { ProgressSpinnerService } from '../../../../../../../services/progress-spinner.service';

import { environment } from '../../../../../../../../environments/environment';
import { Image } from '../../../../images/models/images.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-images',
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
  templateUrl: './images.component.html',
  styleUrl: './images.component.scss',
})
export class AddImagesComponent implements OnInit {
  apiUrl = environment.BASE_URL;
  uploadedFiles: Image[] = [];
  leftFiles: Image[] = [];
  selectedFile: Image | undefined;
  url: string = '';

  constructor(
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly roomImagesService: RoomImagesService,
    private readonly progressSpinnerService: ProgressSpinnerService,
  ) {}

  ngOnInit(): void {
    const id = this.dynamicDialogConfig.data.id;
    this.url = `${this.apiUrl}/images/${id}/multiple-add`;
    this.updateImages(id);
  }

  updateImages(id: number): void {
    this.roomImagesService.findAll(id).subscribe({
      next: (response: Image[]) => {
        this.uploadedFiles = response;
      },
      error: () => {},
    });

    this.roomImagesService.findLeft(id).subscribe({
      next: (response: Image[]) => {
        this.leftFiles = response;
      },
      error: () => {},
    });
  }

  removeImage(imageId: number): void {
    const roomId = this.dynamicDialogConfig.data.id;
    this.progressSpinnerService.show();
    this.roomImagesService
      .remove(roomId, imageId)
      .pipe(
        finalize(() => {
          this.progressSpinnerService.hidden();
        }),
      )
      .subscribe({
        next: () => this.updateImages(roomId),
        error: () => {},
      });
  }

  addImage(event: any) {
    const roomId = this.dynamicDialogConfig.data.id;
    const imageId = event.data.id;
    this.progressSpinnerService.show();
    this.roomImagesService
      .add(roomId, imageId)
      .pipe(
        finalize(() => {
          this.progressSpinnerService.hidden();
        }),
      )
      .subscribe({
        next: () => this.updateImages(roomId),
        error: () => {},
      });
  }

  onUpload(): void {
    const id = this.dynamicDialogConfig.data.id;
    this.updateImages(id);
  }
}
