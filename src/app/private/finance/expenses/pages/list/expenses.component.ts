import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorState } from 'primeng/paginator';
import {
  debounceTime,
  distinctUntilChanged,
  Observable,
  startWith,
} from 'rxjs';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { LoadingService } from '../../../../../services/loading.service';
import {
  showError,
  showSuccess,
  showToastWarn,
} from '../../../../../utils/notifications';
import { Expense } from '../../models/expenses.model';
import { ExpensesService } from '../../services/expenses.service';
import { ExpenseFormComponent } from '../form/expenses-form.component';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpenseListComponent implements OnInit, OnDestroy {
  expenseModal: DynamicDialogRef | undefined;
  columns: Column[] = [
    {
      header: '#',
      field: 'id',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Fecha',
      field: 'expenseDate',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Descripción',
      field: 'description',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Monto',
      field: 'amount',
      clickable: false,
      image: false,
      money: true,
    },
    {
      header: 'Metodo de Pago',
      field: 'paymentMethod',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Usuario',
      field: 'user',
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
  search: string = '';
  callToAction: CallToAction<Expense>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Expense) => this.buttonEditExpense(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Expense, event?: Event) =>
        this.buttonDeleteExpense(rowData.id, event!),
    },
  ];

  formGroup: FormGroup = new FormGroup({
    search: new FormControl<string | null>(null),
  });

  constructor(
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly loadingService: LoadingService,
    private readonly expensesService: ExpensesService,
  ) {}

  ngOnInit(): void {
    this.restoreFilters();
    this.formGroup.get('search')?.setValue(this.search, { emitEvent: false });
    this.formGroup
      .get('search')
      ?.valueChanges.pipe(
        startWith(this.search),
        debounceTime(600),
        distinctUntilChanged(),
      )
      .subscribe((value: any) => {
        const searchTerm = value || '';
        if (this.search !== searchTerm) {
          this.page = 1;
        }

        this.search = searchTerm;
        this.loadingService.sendLoadingState(true);
        this.getExpenses(this.limit, this.page, this.search);
      });
  }

  ngOnDestroy(): void {
    if (this.expenseModal) {
      this.expenseModal.close();
    }
  }

  restoreFilters() {
    const savedState = this.expensesService.getFilterState();
    if (savedState) {
      this.limit = savedState.limit;
      this.page = savedState.page;
      this.search = savedState.search;

      if (this.search) {
        this.formGroup
          .get('search')
          ?.setValue(this.search, { emitEvent: false });
      }
    }
  }

  clearFilter(): void {
    this.search = '';
    this.limit = 10;
    this.page = 1;
    this.expensesService.clearFilterState();
    this.loadingService.sendLoadingState(true);
    this.formGroup.get('search')?.setValue('', { emitEvent: false });
    this.getExpenses(this.limit, 1, '');
  }

  async getExpenses(
    limit = this.limit,
    page = this.page,
    name = this.search,
  ): Promise<void> {
    this.updatePage(page);
    this.expensesService.callGetList(limit, page, name).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  async onPageSelected(paginate: PaginatorState): Promise<void> {
    this.limit = paginate.rows ?? 10;
    this.updatePage((paginate.page ?? 0) + 1);
    this.getExpenses(this.limit, this.page, this.search);
  }

  get expenses(): Observable<Expense[]> {
    return this.expensesService.getList();
  }

  get total(): Observable<number> {
    return this.expensesService.getTotal();
  }

  buttonAddExpense(): void {
    this.expenseModal = this.dialogService.open(ExpenseFormComponent, {
      data: {},
      header: 'Nuevo gasto',
      styleClass: 'dialog-custom-form',
      focusOnShow: false,
    });

    this.expenseModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? showSuccess(this.messageService, 'Gasto creado.')
          : value?.error
            ? showError(this.messageService, value?.error)
            : null;
      },
    });
  }

  buttonEditExpense(id: number): void {
    this.expenseModal = this.dialogService.open(ExpenseFormComponent, {
      data: { id },
      header: 'Detalle gasto',
      styleClass: 'dialog-custom-form',
      focusOnShow: false,
    });

    this.expenseModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? showSuccess(this.messageService, 'Detalle actualizado.')
          : value?.error
            ? showError(this.messageService, value?.error)
            : null;
      },
    });
  }

  buttonDeleteExpense(id: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas cancelar esta venta?',
      header: 'Eliminar venta',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.expensesService.delete(id).subscribe(() => {
          showSuccess(this.messageService, 'El registro ha sido cancelada');
        });
      },
      reject: () => {
        showToastWarn(this.messageService, 'No se realizó ninguna acción.');
      },
    });
  }

  private updatePage(value: number): void {
    this.page = value;
  }
}
