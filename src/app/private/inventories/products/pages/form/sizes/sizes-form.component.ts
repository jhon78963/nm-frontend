import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';

import { ToolbarModule } from 'primeng/toolbar';
import { SizesSelectedService } from '../../../../sizes/services/sizes-selected.service';
import { Product, Size } from '../../../models/products.model';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductsService } from '../../../services/products.service';
import { DialogService } from 'primeng/dynamicdialog';
import { SizesCreateFormComponent } from '../../../../sizes/pages/form/sizes-form.component';
import { showError, showSuccess } from '../../../../../../utils/notifications';
import { MessageService } from 'primeng/api';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductSizesService } from '../../../services/productSizes.service';
import { ProductSizeSave } from '../../../models/sizes.interface';
import { SharedModule } from '../../../../../../shared/shared.module';

@Component({
  selector: 'app-sizes-form',
  standalone: true,
  imports: [
    CommonModule,
    ToolbarModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    RippleModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    RouterLink,
  ],
  templateUrl: './sizes-form.component.html',
  styleUrl: './sizes-form.component.scss',
  providers: [DialogService, MessageService],
})
export class SizesFormComponent implements OnInit {
  productId: number = 0;
  sizeTypeId: number = 0;
  filter: boolean = true;
  products: any[] = [];
  sizeTypes: Size[] = [];
  selectedSizes: any[] = [];
  selectedSizeTypeIds: number[] = [1];
  cols: any[] = [];

  constructor(
    private readonly sizesSelectedService: SizesSelectedService,
    private readonly productsService: ProductsService,
    private readonly productSizesService: ProductSizesService,
    private readonly route: ActivatedRoute,
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
  ) {
    if (this.route.snapshot.paramMap.get('id')) {
      this.productId = Number(this.route.snapshot.paramMap.get('id'));
    }
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  ngOnInit(): void {
    this.getSizes();
    this.getSizeTypes();
  }

  getSizeTypes() {
    this.sizesSelectedService.getSizeTypes().subscribe({
      next: (sizeTypes: Size[]) => {
        this.sizeTypes = sizeTypes;
      },
    });
  }

  async getSizes(): Promise<void> {
    if (this.productId !== 0) {
      this.productsService.getOne(this.productId).subscribe({
        next: (product: Product) => {
          this.filter = product.filter;
          this.selectedSizeTypeIds = product.sizeTypeId.length
            ? product.sizeTypeId
            : [1];
          console.log(this.selectedSizeTypeIds);
          this.sizesSelectedService
            .callGetList(this.productId, this.selectedSizeTypeIds)
            .subscribe();
        },
      });
    }
  }

  get sizes(): Observable<Size[]> {
    return this.sizesSelectedService.getList();
  }

  handleSizeTypeSelection(ids: number[]) {
    this.selectedSizeTypeIds = ids;
    this.sizesSelectedService
      .callGetList(this.productId, this.selectedSizeTypeIds)
      .subscribe();
  }

  createSize() {
    const modal = this.dialogService.open(SizesCreateFormComponent, {
      data: {
        productId: this.productId,
        sizeTypeId: this.sizeTypeId || this.selectedSizeTypeIds,
      },
      header: 'Crear Talla',
      styleClass: 'dialog-custom-form',
    });

    modal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? showSuccess(this.messageService, 'Talla Creada.')
          : value?.error
            ? showError(
                this.messageService,
                'Hubo un error, intente nuevamente',
              )
            : null;
      },
    });
  }

  selectSize(size: any) {
    const exists = this.selectedSizes.some(s => s.id === size.id);
    if (!exists) {
      this.selectedSizes = [...this.selectedSizes, size];
    }

    const isEmpty =
      !size.barcode?.toString().trim() &&
      !size.stock?.toString().trim() &&
      !size.purchasePrice?.toString().trim() &&
      !size.salePrice?.toString().trim() &&
      !size.minSalePrice?.toString().trim();
    if (isEmpty) {
      this.selectedSizes = this.selectedSizes.filter(s => s.id !== size.id);
    }
  }

  saveAllSelectedSizes() {
    const requests = this.selectedSizes.map(size => {
      const productSizeSave: ProductSizeSave = {
        barcode: size.barcode,
        stock: size.stock,
        purchasePrice: size.purchasePrice,
        salePrice: size.salePrice,
        minSalePrice: size.minSalePrice,
      };

      return this.productSizesService
        .add(this.productId, size.id, productSizeSave)
        .pipe(
          catchError(() => {
            return of(null);
          }),
        );
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.getSizes();
        this.selectedSizes = [];
      },
    });
  }

  deleteAllSelectedSizes() {
    const requests = this.selectedSizes.map(size => {
      return this.productSizesService.remove(this.productId, size.id).pipe(
        catchError(() => {
          return of(null);
        }),
      );
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.getSizes();
        this.selectedSizes = [];
      },
    });
  }

  saveSizeProductButton(size: any) {
    const productSizeSave: ProductSizeSave = {
      barcode: size.barcode,
      stock: size.stock,
      purchasePrice: size.purchasePrice,
      salePrice: size.salePrice,
      minSalePrice: size.minSalePrice,
    };

    this.productSizesService
      .add(this.productId, size.id, productSizeSave)
      .subscribe({
        next: () => {
          this.getSizes();
          this.selectedSizes = this.selectedSizes.filter(s => s.id !== size.id);
        },
        error: () => this.getSizes(),
      });
  }

  editSizeProductButton(size: any) {
    this.saveSizeProductButton(size);
  }
  removeSizeProductButton(size: any) {
    this.productSizesService.remove(this.productId, size.id).subscribe({
      next: () => {
        this.getSizes();
        this.selectedSizes = this.selectedSizes.filter(s => s.id !== size.id);
      },
      error: () => this.getSizes(),
    });
  }
}
