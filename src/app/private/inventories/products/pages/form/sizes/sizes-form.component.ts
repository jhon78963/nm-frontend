import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';

import { ToolbarModule } from 'primeng/toolbar';
import { SizesSelectedService } from '../../../../size/services/sizes-selected.service';
import { Product, Size } from '../../../models/products.model';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductsService } from '../../../services/products.service';

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
  ],
  templateUrl: './sizes-form.component.html',
  styleUrl: './sizes-form.component.scss',
})
export class SizesFormComponent implements OnInit {
  productId: number = 0;
  sizeTypeId: number = 0;
  filter: boolean = true;
  products: any[] = [];
  sizeTypes: Size[] = [];
  selectedSizes: any[] = [];
  selectedSizeTypeId: number = 1;
  cols: any[] = [];

  constructor(
    private readonly sizesSelectedService: SizesSelectedService,
    private readonly productsService: ProductsService,
    private readonly route: ActivatedRoute,
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
          this.sizeTypeId = product.sizeTypeId || 0;
          this.sizesSelectedService
            .callGetList(this.productId, this.sizeTypeId)
            .subscribe();
        },
      });
    }
  }

  get sizes(): Observable<Size[]> {
    return this.sizesSelectedService.getList();
  }

  selectFilter(sizeTypeId: number) {
    this.selectedSizeTypeId = sizeTypeId;
    this.sizesSelectedService
      .callGetList(this.productId, this.selectedSizeTypeId)
      .subscribe();
  }

  createSize() {}
  saveSelectedSizes() {}
  deleteSelectedSizes() {}

  editSizeProductButton(size: any) {
    console.log({ size, sizes: this.selectedSizes });
  }

  removeSizeProductButton(size: any) {
    console.log({ size, sizes: this.selectedSizes });
  }
}
