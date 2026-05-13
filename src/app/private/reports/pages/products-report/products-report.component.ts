import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import {
  ProductInventoryColorApi,
  ProductInventoryReportApi,
  ReportsService,
} from '../../services/reports-service.service';

export type ProductsReportTableRow =
  | { kind: 'product'; name: string }
  | {
      kind: 'size';
      size: string;
      barcode: string | null;
      purchasePrice: number | null;
      salePrice: number | null;
      minSalePrice: number | null;
      sizeStock: number | null;
      colorsSummary: string;
      colorsStockSum: number | null;
      stockMismatch: boolean;
    };

@Component({
  selector: 'app-products-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    TableModule,
    ButtonModule,
    SkeletonModule,
    TooltipModule,
  ],
  templateUrl: './products-report.component.html',
})
export class ProductsReportComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);

  loading = signal(true);
  exporting = signal(false);
  rawProducts = signal<ProductInventoryReportApi[]>([]);

  tableRows = computed(() => this.buildTableRows(this.rawProducts()));

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.reportsService.getProductsInventoryReport().subscribe({
      next: res => {
        if (res.success) {
          this.rawProducts.set(res.data ?? []);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  exportPdf(): void {
    this.exporting.set(true);
    this.reportsService.downloadProductsInventoryPdf().subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `reporte-productos-inventario-${new Date().toISOString().slice(0, 10)}.pdf`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }

  private buildTableRows(
    products: ProductInventoryReportApi[],
  ): ProductsReportTableRow[] {
    const out: ProductsReportTableRow[] = [];

    for (const product of products) {
      out.push({ kind: 'product', name: product.name });

      const sizes = product.sizes ?? [];
      if (sizes.length === 0) {
        out.push({
          kind: 'size',
          size: '—',
          barcode: null,
          purchasePrice: null,
          salePrice: null,
          minSalePrice: null,
          sizeStock: null,
          colorsSummary: '—',
          colorsStockSum: null,
          stockMismatch: false,
        });
        continue;
      }

      for (const size of sizes) {
        const colors = size.colors ?? [];
        const colorsStockSum = colors.length
          ? colors.reduce((acc, c) => acc + (c.stock ?? 0), 0)
          : null;
        const sizeStock = size.stock;
        const stockMismatch =
          colorsStockSum !== null &&
          colorsStockSum !== sizeStock;

        out.push({
          kind: 'size',
          size: size.size,
          barcode: size.barcode ?? null,
          purchasePrice: size.purchase_price,
          salePrice: size.sale_price,
          minSalePrice: size.min_sale_price,
          sizeStock,
          colorsSummary: this.formatColorsSummary(colors),
          colorsStockSum,
          stockMismatch,
        });
      }
    }

    return out;
  }

  private formatColorsSummary(colors: ProductInventoryColorApi[]): string {
    if (!colors.length) {
      return '—';
    }
    return colors.map(c => `${c.stock} ${c.color}`).join(', ');
  }
}
