import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorState } from 'primeng/paginator';
import { Observable } from 'rxjs';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { LoadingService } from '../../../../../services/loading.service';
import { showError, showSuccess } from '../../../../../utils/notifications';
import { User } from '../../models/users.model';
import { UsersService } from '../../services/users.service';
import { UserFormComponent } from '../form/users-form.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class UserListComponent implements OnInit, OnDestroy {
  userModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  limit: number = 10;
  page: number = 1;
  name: string = '';
  callToAction: CallToAction<User>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: User) => this.buttonEditUSer(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: User, event?: Event) =>
        this.buttonDeleteUser(rowData.id, event!),
    },
  ];

  constructor(
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly loadingService: LoadingService,
    private readonly usersService: UsersService,
  ) {}

  ngOnInit(): void {
    this.columns = [
      {
        header: 'Username',
        field: 'username',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Email',
        field: 'email',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Nombres',
        field: 'name',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Apellidos',
        field: 'surname',
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

    this.getUSers(this.limit, this.page, this.name);
  }

  ngOnDestroy(): void {
    if (this.userModal) {
      this.userModal.close();
    }
  }

  async getUSers(
    limit = this.limit,
    page = this.page,
    name = this.name,
  ): Promise<void> {
    this.updatePage(page);
    this.usersService.callGetList(limit, page, name).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  async onPageSelected(paginate: PaginatorState): Promise<void> {
    this.updatePage((paginate.page ?? 0) + 1);
    this.getUSers(paginate.rows, this.page);
  }

  get users(): Observable<User[]> {
    return this.usersService.getList();
  }

  get total(): Observable<number> {
    return this.usersService.getTotal();
  }

  buttonAddUser(): void {
    this.userModal = this.dialogService.open(UserFormComponent, {
      data: {},
      header: 'Crear usuario',
      styleClass: 'dialog-custom-form',
    });

    this.userModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? showSuccess(this.messageService, 'Usuario Creado.')
          : value?.error
            ? showError(this.messageService, value?.error)
            : null;
      },
    });
  }

  buttonEditUSer(id: number): void {
    this.userModal = this.dialogService.open(UserFormComponent, {
      data: { id },
      header: 'Editar usuario',
      styleClass: 'dialog-custom-form',
    });

    this.userModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? showSuccess(this.messageService, 'Usuario actualizado.')
          : value?.error
            ? showError(this.messageService, value?.error)
            : null;
      },
    });
  }

  buttonDeleteUser(id: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar este usuario?',
      header: 'Eliminar usuario',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',

      accept: () => {
        this.usersService.delete(id).subscribe(() => {
          showSuccess(this.messageService, 'El usuario ha sido eliminado');
        });
      },
      reject: () => {
        showError(
          this.messageService,
          'No se eleminó el usuario, intenteló nuevamente',
        );
      },
    });
  }

  private updatePage(value: number): void {
    this.page = value;
  }
}
