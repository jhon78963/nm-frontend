import { Component, Input, output } from '@angular/core';

import { ProductSize, Size } from '../../../models/products.model';

@Component({
  selector: 'app-size-table',
  standalone: true,
  imports: [],
  templateUrl: './sizes-table.component.html',
  styleUrl: './sizes-table.component.scss',
})
export class SizesTableComponent {
  @Input() productId: number = 0;
  @Input() sizes: Size[] = [];
  productSizeSelected = output<ProductSize>();

  productSizeButton(sizeId: number, productId: number, type: string) {
    this.productSizeSelected.emit({ sizeId, productId, type });
  }
}
