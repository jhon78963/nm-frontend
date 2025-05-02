import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';

import { ToolbarModule } from 'primeng/toolbar';
import { SizesSelectedService } from '../../../../size/services/sizes-selected.service';
import { Size } from '../../../models/products.model';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

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
  products: any[] = [];
  sizeTypes: Size[] = [];
  selectedProducts: any[] = [];
  cols: any[] = [];

  constructor(
    private readonly sizesSelectedService: SizesSelectedService,
    private readonly route: ActivatedRoute,
  ) {
    if (this.route.snapshot.paramMap.get('id')) {
      this.productId = Number(this.route.snapshot.paramMap.get('id'));
    }
  }

  openNew() {}
  deleteSelectedProducts() {}
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
    this.sizesSelectedService.callGetList(this.productId).subscribe();
  }

  get sizes(): Observable<Size[]> {
    return this.sizesSelectedService.getList();
  }
}
