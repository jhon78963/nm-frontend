import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorState } from 'primeng/paginator';
import { debounceTime, Observable } from 'rxjs';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { LoadingService } from '../../../../../services/loading.service';
import { Tenant } from '../../models/tenants.model';
import { TenantsService } from '../../services/tenants.service';
import { TenantsFormComponent } from '../form/tenants-form.component';

@Component({
  selector: 'app-tenants-list',
  templateUrl: './tenants.component.html',
  styleUrl: './tenants.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class TenantsListComponent implements OnInit, OnDestroy {
  modal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: unknown;
  limit = 10;
  page = 1;
  name = '';
  callToAction: CallToAction<Tenant>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (row: Tenant) => this.openEdit(row.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (row: Tenant, event?: Event) => this.confirmDelete(row.id, event!),
    },
  ];

  formGroup = new FormGroup({
    search: new FormControl<string | null>(null),
  });

  constructor(
    private readonly dialogService: DialogService,
    private readonly tenantsService: TenantsService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    this.columns = [
      { header: '#', field: 'id', clickable: false, image: false, money: false },
      { header: 'Cliente', field: 'name', clickable: false, image: false, money: false },
      { field: 'button', header: 'Acción', clickable: false, image: false, money: false },
    ];
    this.load(this.limit, this.page, this.name);
    this.formGroup
      .get('search')
      ?.valueChanges.pipe(debounceTime(600))
      .subscribe(v => {
        this.name = v ?? '';
        this.loadingService.sendLoadingState(true);
        this.load(this.limit, this.page, this.name);
      });
  }

  ngOnDestroy(): void {
    this.modal?.close();
  }

  clearFilter(): void {
    this.name = '';
    this.loadingService.sendLoadingState(true);
    this.formGroup.get('search')?.setValue('');
  }

  load(limit = this.limit, page = this.page, search = this.name): void {
    this.page = page;
    this.tenantsService.callGetList(limit, page, search).subscribe();
    setTimeout(() => this.loadingService.sendLoadingState(false), 600);
  }

  get rows(): Observable<Tenant[]> {
    return this.tenantsService.getList();
  }

  get total(): Observable<number> {
    return this.tenantsService.getTotal();
  }

  onPageSelected(event: PaginatorState): void {
    this.page = (event.page ?? 0) + 1;
    this.load(event.rows, this.page);
  }

  openCreate(): void {
    this.modal = this.dialogService.open(TenantsFormComponent, {
      data: {},
      header: 'Nuevo cliente (tenant)',
      width: '26rem',
    });
    this.modal.onClose.subscribe(v => {
      if (v?.success) {
        this.toast('success', 'Tenant creado.');
      } else if (v?.error) {
        this.toast('error', v.error);
      }
    });
  }

  openEdit(id: number): void {
    this.modal = this.dialogService.open(TenantsFormComponent, {
      data: { id },
      header: 'Editar tenant',
      width: '26rem',
    });
    this.modal.onClose.subscribe(v => {
      if (v?.success) {
        this.toast('success', 'Tenant actualizado.');
      } else if (v?.error) {
        this.toast('error', v.error);
      }
    });
  }

  confirmDelete(id: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Eliminar este cliente? No debe tener tiendas ni usuarios asociados.',
      header: 'Eliminar cliente',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.tenantsService.delete(id).subscribe(() => {
          this.toast('success', 'Tenant eliminado.');
        });
      },
    });
  }

  private toast(severity: 'success' | 'error', detail: string): void {
    this.messageService.add({
      severity,
      summary: severity === 'success' ? 'Listo' : 'Error',
      detail,
      life: 3500,
    });
  }
}
