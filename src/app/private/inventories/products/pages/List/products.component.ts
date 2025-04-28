import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { Product } from '../../models/products.model';
import { DialogService } from 'primeng/dynamicdialog';
import { LoadingService } from '../../../../../services/loading.service';
import { ProductsService } from '../../services/products.service';
import { PaginatorState } from 'primeng/paginator';
import { Observable } from 'rxjs';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    ConfirmDialogModule,
    SharedModule,
    RouterModule,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
  providers: [ConfirmationService, DialogService, MessageService],
})
export class ProductListComponent implements OnInit {
  columns: Column[] = [
    {
      header: '#',
      field: 'id',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Género',
      field: 'gender',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Nombre',
      field: 'name',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Stock',
      field: 'stock',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Precio de venta',
      field: 'salePrice',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Acción',
      field: 'button',
      clickable: false,
      image: false,
      money: false,
    },
  ];
  cellToAction: any;
  limit: number = 10;
  page: number = 1;
  name: string = '';
  callToAction: CallToAction<Product>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Product) => this.editProductButton(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-shop',
      outlined: true,
      pTooltip: 'Ecommerce',
      tooltipPosition: 'bottom',
      click: (rowData: Product) => this.ecommerceProductButton(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Product, event?: Event) =>
        this.deleteProductButton(rowData.id, event!),
    },
  ];

  constructor(
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly loadingService: LoadingService,
    private readonly productsService: ProductsService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.getProducts(this.limit, this.page, this.name);
  }

  async getProducts(
    limit = this.limit,
    page = this.page,
    name = this.name,
  ): Promise<void> {
    this.updatePage(page);
    this.productsService.callGetList(limit, page, name).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  async onPageSelected(paginate: PaginatorState): Promise<void> {
    this.updatePage((paginate.page ?? 0) + 1);
    this.getProducts(paginate.rows, this.page);
  }

  get products(): Observable<Product[]> {
    return this.productsService.getList();
  }

  get total(): Observable<number> {
    return this.productsService.getTotal();
  }

  addProductButton() {
    this.router.navigate(['/inventories/products/create']);
  }

  editProductButton(id: number) {
    this.router.navigate([`/inventories/products/edit/${id}`]);
  }

  ecommerceProductButton(id: number) {
    this.router.navigate([`/inventories/products/ecommerce/${id}`]);
  }

  deleteProductButton(id: number, event: Event) {
    console.log({ id, event });
  }

  private updatePage(value: number): void {
    this.page = value;
  }
}
