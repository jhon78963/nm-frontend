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
import { debounceTime, Observable } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { showError, showSuccess } from '../../../../../utils/notifications';
import { FormControl, FormGroup } from '@angular/forms';
import { GendersService } from '../../../../../services/genders.service';
import { Gender } from '../../../../../models/gender.interface';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    ConfirmDialogModule,
    RouterModule,
    SharedModule,
    ToastModule,
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
      icon: 'pi pi-tag',
      outlined: true,
      pTooltip: 'Tallas',
      tooltipPosition: 'bottom',
      click: (rowData: Product) => this.sizeProductButton(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-palette',
      outlined: true,
      pTooltip: 'Colores',
      tooltipPosition: 'bottom',
      click: (rowData: Product) => this.colorProductButton(rowData.id),
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
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-history',
      outlined: true,
      pTooltip: 'Historial',
      tooltipPosition: 'bottom',
      click: (rowData: Product) => this.historyProductButton(rowData.id),
    },
  ];

  genders: Gender[] = [];
  selectedGenderIds: number[] = [];

  formGroup: FormGroup = new FormGroup({
    search: new FormControl<string | null>(null),
  });

  constructor(
    private readonly router: Router,
    private readonly confirmationService: ConfirmationService,
    private readonly gendersService: GendersService,
    private readonly loadingService: LoadingService,
    private readonly messageService: MessageService,
    private readonly productsService: ProductsService,
  ) {}

  ngOnInit(): void {
    this.restoreFilters();
    this.getProducts(this.limit, this.page, this.name, this.selectedGenderIds);
    this.formGroup
      .get('search')
      ?.valueChanges.pipe(debounceTime(600))
      .subscribe((value: any) => {
        this.name = value ? value : '';
        this.loadingService.sendLoadingState(true);
        this.getProducts(this.limit, 1, this.name, this.selectedGenderIds);
      });

    this.gendersService.getAll().subscribe((genders: Gender[]) => {
      this.genders = genders;
    });
  }

  restoreFilters() {
    const savedState = this.productsService.getFilterState();
    if (savedState) {
      this.limit = savedState.limit;
      this.page = savedState.page;
      this.name = savedState.name;
      this.selectedGenderIds = savedState.genderId || [];

      if (this.name) {
        this.formGroup.get('search')?.setValue(this.name, { emitEvent: false });
      }
    }
  }

  selectFilter(genderId: number) {
    this.selectedGenderIds.push(genderId);
  }

  clearFilter(): void {
    this.name = '';
    this.limit = 10;
    this.selectedGenderIds = [];
    this.loadingService.sendLoadingState(true);
    this.formGroup.get('search')?.setValue('');
    this.getProducts(this.limit, 1, '', []);
  }

  handleGenderSelection(ids: number[]) {
    this.selectedGenderIds = ids;
    this.loadingService.sendLoadingState(true);
    this.getProducts(this.limit, 1, this.name, this.selectedGenderIds);
  }

  async getProducts(
    limit = this.limit,
    page = this.page,
    name = this.name,
    gender = this.selectedGenderIds,
  ): Promise<void> {
    this.updatePage(page);
    this.productsService.callGetList(limit, page, name, gender).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  async onPageSelected(paginate: PaginatorState): Promise<void> {
    this.limit = paginate.rows ?? 10;
    this.updatePage((paginate.page ?? 0) + 1);
    this.getProducts(this.limit, this.page, this.name, this.selectedGenderIds);
  }

  get products(): Observable<Product[]> {
    return this.productsService.getList();
  }

  get total(): Observable<number> {
    return this.productsService.getTotal();
  }

  addProductButton() {
    this.router.navigate(['/inventories/products/create/general']);
  }

  editProductButton(id: number) {
    this.router.navigate([`/inventories/products/step/general/${id}`]);
  }

  sizeProductButton(id: number) {
    this.router.navigate([`/inventories/products/sizes/${id}`]);
  }

  colorProductButton(id: number) {
    this.router.navigate([`/inventories/products/colors/${id}`]);
  }

  ecommerceProductButton(id: number) {
    this.router.navigate([`/inventories/products/ecommerce/${id}`]);
  }
  historyProductButton(id: number) {
    this.router.navigate([`/inventories/products/history/${id}`]);
  }

  deleteProductButton(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar este producto?',
      header: 'Eliminar producto',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.productsService.delete(id).subscribe({
          next: () =>
            showSuccess(this.messageService, 'El producto ha sido eliminado'),
          error: () =>
            showError(
              this.messageService,
              'No se eleminó el producto, intenteló nuevamente',
            ),
        });
      },
      reject: () => {},
    });
  }

  private updatePage(value: number): void {
    this.page = value;
  }
}
