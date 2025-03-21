import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { debounceTime, Observable, Subject } from 'rxjs';
import { RolesService } from '../../services/roles.service';
import { LoadingService } from '../../../../../services/loading.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RolesFormComponent } from '../form/roles-form.component';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { Role } from '../../models/roles.model';
import { PaginatorState } from 'primeng/paginator';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule, ToastModule, SharedModule],
  providers: [ConfirmationService, MessageService],
})
export class RoleListComponent implements OnInit, OnDestroy {
  roleModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  data: any[] = [];
  limit: number = 10;
  page: number = 1;
  name: string = '';
  callToAction: CallToAction<Role>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Role) => this.buttonEditRole(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Role, event?: Event) =>
        this.buttonDeleteRole(rowData.id, event!),
    },
  ];

  private searchTermSubject = new Subject<string>();

  constructor(
    private readonly dialogService: DialogService,
    private readonly rolesService: RolesService,
    public messageService: MessageService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    this.columns = [
      {
        header: '#',
        field: 'id',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Rol',
        field: 'name',
        clickable: false,
        image: false,
        money: false,
      },
      {
        field: 'button',
        header: 'Acción',
        clickable: false,
        image: false,
        money: false,
      },
    ];

    this.getRoles(this.limit, this.page, this.name);
    this.searchTermSubject.pipe(debounceTime(600)).subscribe(() => {
      this.loadingService.sendLoadingState(true);
      this.getRoles(this.limit, this.page, this.name);
    });
  }

  ngOnDestroy(): void {
    if (this.roleModal) {
      this.roleModal.close();
    }
  }

  clearFilter(): void {
    this.name = '';
    this.onSearchTermChange('');
  }

  private updatePage(value: number): void {
    this.page = value;
  }

  onSearchTermChange(term: any): void {
    this.searchTermSubject.next(term);
  }

  async getRoles(
    limit = this.limit,
    page = this.page,
    name = this.name,
  ): Promise<void> {
    this.updatePage(page);
    this.rolesService.callGetList(limit, page, name).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  get roles(): Observable<Role[]> {
    return this.rolesService.getList();
  }

  get total(): Observable<number> {
    return this.rolesService.getTotal();
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getRoles(event.rows, this.page);
  }

  buttonAddRole(): void {
    this.roleModal = this.dialogService.open(RolesFormComponent, {
      data: {},
      header: 'Crear',
    });

    this.roleModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Role Creado.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonEditRole(id: number): void {
    this.roleModal = this.dialogService.open(RolesFormComponent, {
      data: {
        id,
      },
      header: 'Editar',
    });

    this.roleModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Role actualizado.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonDeleteRole(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar este rol?',
      header: 'Eliminar rol',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',

      accept: () => {
        this.rolesService.delete(id).subscribe(() => {
          this.showSuccess('El rol ha sido eliminado');
        });
      },
      reject: () => {
        this.showError('No se eleminó el rol, intenteló nuevamente');
      },
    });
  }

  showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Confirmado',
      detail: message,
      life: 3000,
    });
  }

  showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 3000,
    });
  }
}
