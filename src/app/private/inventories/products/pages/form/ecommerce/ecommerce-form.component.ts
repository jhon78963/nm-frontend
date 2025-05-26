import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SharedModule } from '../../../../../../shared/shared.module';
import { ToastModule } from 'primeng/toast';
import { KeyFilterModule } from 'primeng/keyfilter';
import { MessageService } from 'primeng/api';
import { ImageModule } from 'primeng/image';
import { TooltipModule } from 'primeng/tooltip';
import { InputImage } from '../../../../../../shared/custom-form-components/input-image/input-image.component';
import { FileService } from '../../../../../../services/file.service';
import { getFileSize } from '../../../../../../utils/files';
import { PImage } from '../../../models/images.interface';
import { Observable } from 'rxjs';
import { LoadingService } from '../../../../../../services/loading.service';

@Component({
  selector: 'app-products-ecommerce-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    SharedModule,
    ToastModule,
    KeyFilterModule,
    ImageModule,
    TooltipModule,
  ],
  templateUrl: './ecommerce-form.component.html',
  styleUrl: './ecommerce-form.component.scss',
  providers: [MessageService],
})
export class EcommerceFormComponent implements OnInit {
  productId: number = 0;
  constructor(
    private readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly fileService: FileService,
    private readonly loadingService: LoadingService,
  ) {
    if (this.route.snapshot.paramMap.get('id')) {
      this.productId = Number(this.route.snapshot.paramMap.get('id'));
    }
  }

  form: FormGroup = this.formBuilder.group({
    id: [null],
    percentageDiscount: ['', Validators.required],
    cashDiscount: ['', Validators.required],
  });

  ngOnInit(): void {
    this.getImages(this.productId);
  }

  async getImages(productId = this.productId): Promise<void> {
    this.fileService.callGetList(productId).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  get images(): Observable<PImage[]> {
    return this.fileService.getList();
  }

  getFormData(inputImage: InputImage): void {
    const formData = new FormData();
    const sizes: string[] = [];
    const names: string[] = [];
    let size: string = '';
    let name: string = '';
    if (inputImage.multiply && Array.isArray(inputImage.images)) {
      inputImage.images.forEach((file: File) => {
        formData.append('file[]', file);
        sizes.push(getFileSize(file.size));
        names.push(file.name);
      });
    } else if (inputImage.images instanceof File) {
      formData.append('file', inputImage.images);
      size = getFileSize(inputImage.images.size);
      name = inputImage.images.name;
    }

    this.fileService.createImage(formData, inputImage.multiply).subscribe({
      next: (resp: any) => {
        if (resp.image) {
          this.fileService
            .saveImage(this.productId, { image: resp.image, size, name })
            .subscribe();
        }
        if (resp.images) {
          this.fileService
            .saveMultipleImage(this.productId, {
              image: resp.images,
              size: sizes,
              name: names,
            })
            .subscribe();
        }
      },
      error: () => {
        console.error('Error al subir');
      },
    });
  }

  saveProductButton() {}
}
