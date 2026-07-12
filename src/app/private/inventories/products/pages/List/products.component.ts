import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService } from 'primeng/dynamicdialog';
import { PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { Gender } from '../../../../../models/gender.interface';
import { GendersService } from '../../../../../services/genders.service';
import { LoadingService } from '../../../../../services/loading.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { showError, showSuccess } from '../../../../../utils/notifications';
import { Product } from '../../models/products.model';
import { ProductsService } from '../../services/products.service';

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
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('importInput') importInput!: ElementRef<HTMLInputElement>;

  isExporting = false;
  isImporting = false;

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
      icon: 'pi pi-table',
      outlined: true,
      pTooltip: 'Actualizar inventario',
      tooltipPosition: 'bottom',
      click: (rowData: Product) => this.inventoryUpdateButton(rowData.id),
    },
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
      icon: 'pi pi-list',
      outlined: true,
      pTooltip: 'Ver Kardex',
      tooltipPosition: 'bottom',
      click: (rowData: Product) => this.kardexProductButton(rowData.id),
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

    const searchControl = this.formGroup.get('search');
    if (searchControl) {
      searchControl.valueChanges
        .pipe(
          map((value: string | null) => (value ?? '').trim()),
          debounceTime(600),
          distinctUntilChanged(),
          switchMap((term: string) => {
            this.name = term;
            return this.fetchProducts(
              this.limit,
              1,
              this.name,
              this.selectedGenderIds,
            );
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe();
    }

    this.gendersService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((genders: Gender[]) => {
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

  getProducts(
    limit = this.limit,
    page = this.page,
    name = this.name,
    gender = this.selectedGenderIds,
  ): void {
    this.fetchProducts(limit, page, name, gender).subscribe();
  }

  /** Petición HTTP + loading; el debounce vive en valueChanges del buscador. */
  private fetchProducts(
    limit: number,
    page: number,
    name: string,
    gender: number[],
  ): Observable<void> {
    this.updatePage(page);
    this.loadingService.sendLoadingState(true);
    return this.productsService
      .callGetList(limit, page, name, gender)
      .pipe(finalize(() => this.loadingService.sendLoadingState(false)));
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

  inventoryUpdateButton(id: number) {
    this.router.navigate([`/inventories/reconciliation/${id}`]);
  }

  sizeProductButton(id: number) {
    this.router.navigate([`/inventories/products/step/sizes/${id}`]);
  }

  colorProductButton(id: number) {
    this.router.navigate([`/inventories/products/step/colors/${id}`]);
  }

  ecommerceProductButton(id: number) {
    this.router.navigate([`/inventories/products/step/ecommerce/${id}`]);
  }
  historyProductButton(id: number) {
    this.router.navigate([`/inventories/products/step/history/${id}`]);
  }

  kardexProductButton(id: number) {
    this.router.navigate([`/inventories/products/kardex/${id}`]);
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

  exportProducts(): void {
    this.isExporting = true;
    this.productsService
      .exportToExcel()
      .pipe(finalize(() => (this.isExporting = false)))
      .subscribe({
        next: (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `productos_${new Date().toISOString().slice(0, 10)}.xlsx`;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () =>
          showError(this.messageService, 'Error al exportar productos'),
      });
  }

  triggerImport(): void {
    this.importInput.nativeElement.value = '';
    this.importInput.nativeElement.click();
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isImporting = true;
    this.productsService
      .importFromExcel(file)
      .pipe(finalize(() => (this.isImporting = false)))
      .subscribe({
        next: (res) => {
          if (res.errors?.length) {
            showError(
              this.messageService,
              `Importación con errores: ${res.errors.slice(0, 3).join('; ')}`,
            );
          } else {
            showSuccess(this.messageService, res.message);
          }
          this.getProducts(this.limit, this.page, this.name, this.selectedGenderIds);
        },
        error: () =>
          showError(this.messageService, 'Error al importar el archivo'),
      });
  }
}
