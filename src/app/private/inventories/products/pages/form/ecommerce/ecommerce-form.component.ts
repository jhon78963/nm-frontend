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
import { ProgressSpinnerService } from '../../../../../../services/progress-spinner.service';
import { Product, ProductSave } from '../../../models/products.model';
import { ProductsService } from '../../../services/products.service';

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
  imageSaved: any;
  imagesSaved: any;
  constructor(
    private readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly fileService: FileService,
    private readonly productsService: ProductsService,
    private readonly loadingService: LoadingService,
    private readonly progressSpinnerService: ProgressSpinnerService,
  ) {
    if (this.route.snapshot.paramMap.get('id')) {
      this.productId = Number(this.route.snapshot.paramMap.get('id'));
    }
  }

  form: FormGroup = this.formBuilder.group({
    id: [null],
    percentageDiscount: ['', Validators.nullValidator],
    cashDiscount: ['', Validators.nullValidator],
  });

  ngOnInit(): void {
    this.getImages(this.productId);

    if (this.productId !== 0) {
      this.productsService.getOne(this.productId).subscribe({
        next: (product: Product) => {
          this.form.patchValue(product);
        },
      });
    }
  }

  saveProductButton() {
    this.progressSpinnerService.show();
    const product = new ProductSave(this.form.value);
    if (this.productId) {
      this.productsService.edit(this.productId, product).subscribe({
        next: () => this.progressSpinnerService.hidden(),
        error: () => this.progressSpinnerService.hidden(),
      });
    }
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

    this.progressSpinnerService.show();
    this.fileService.createImage(formData, inputImage.multiply).subscribe({
      next: (resp: any) => {
        if (resp.image) {
          this.fileService
            .saveImage(this.productId, { image: resp.image, size, name })
            .subscribe({
              next: () => {
                this.imageSaved = { image: resp.image, size, name };
                this.progressSpinnerService.hidden();
              },
              error: () => this.progressSpinnerService.hidden(),
            });
        }
        if (resp.images) {
          this.fileService
            .saveMultipleImage(this.productId, {
              image: resp.images,
              size: sizes,
              name: names,
            })
            .subscribe({
              next: () => {
                this.imagesSaved = {
                  images: resp.images,
                  sizes,
                  names,
                };
                this.progressSpinnerService.hidden();
              },
              error: () => this.progressSpinnerService.hidden(),
            });
        }
      },
      error: () => {
        console.error('Error al subir');
      },
    });
  }

  imagesToDelete(collection: any) {
    this.progressSpinnerService.show();
    if (collection.multiply) {
      this.fileService
        .removeMultipleImage(this.productId, collection.images)
        .subscribe({
          next: () => this.progressSpinnerService.hidden(),
          error: () => this.progressSpinnerService.hidden(),
        });
    } else {
      this.fileService.deleteImage(collection.images).subscribe({
        next: () => {
          this.fileService
            .removeImage(this.productId, collection.images)
            .subscribe({
              next: () => {
                this.progressSpinnerService.hidden();
              },
            });
        },
        error: () => this.progressSpinnerService.hidden(),
      });
    }
  }
}
