import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { SocialNetwork } from '../../models/social-network.model';
import { debounceTime, Observable, Subject } from 'rxjs';
import { SocialNetworkService } from '../../services/social-network.service';
import { LoadingService } from '../../../../../services/loading.service';
import { SocialNetworkFormComponent } from '../form/social-network-form.component';
import { PaginatorState } from 'primeng/paginator';

@Component({
  selector: 'app-social-network',
  templateUrl: './social-network.component.html',
  styleUrl: './social-network.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class SocialNetworkListComponent implements OnInit, OnDestroy {
  socialNetworkModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  limit: number = 10;
  page: number = 1;
  name: string = '';
  callToAction: CallToAction<SocialNetwork>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: SocialNetwork) =>
        this.buttonEditSocialNetwork(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: SocialNetwork, event?: Event) =>
        this.buttonDeleteSocialNetwork(rowData.id, event!),
    },
  ];

  private searchTermSubject = new Subject<string>();

  constructor(
    private readonly dialogService: DialogService,
    private readonly socialNetworkService: SocialNetworkService,
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
        header: 'Red Social',
        field: 'name',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Ícono',
        field: 'icon',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Enlace',
        field: 'url',
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

    this.getSocialNetworks(this.limit, this.page, this.name);
    this.searchTermSubject.pipe(debounceTime(600)).subscribe(() => {
      this.loadingService.sendLoadingState(true);
      this.getSocialNetworks(this.limit, this.page, this.name);
    });
  }

  ngOnDestroy(): void {
    if (this.socialNetworkModal) {
      this.socialNetworkModal.close();
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

  async getSocialNetworks(
    limit = this.limit,
    page = this.page,
    name = this.name,
  ): Promise<void> {
    this.updatePage(page);
    this.socialNetworkService.callGetList(limit, page, name).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  get socialNetworks(): Observable<SocialNetwork[]> {
    return this.socialNetworkService.getList();
  }

  get total(): Observable<number> {
    return this.socialNetworkService.getTotal();
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getSocialNetworks(event.rows, this.page);
  }

  buttonAddSocialNetwork(): void {
    this.socialNetworkModal = this.dialogService.open(
      SocialNetworkFormComponent,
      {
        data: {},
        header: 'Crear',
        styleClass: 'dialog-custom',
      },
    );

    this.socialNetworkModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Red social creada.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonEditSocialNetwork(id: number): void {
    this.socialNetworkModal = this.dialogService.open(
      SocialNetworkFormComponent,
      {
        data: {
          id,
        },
        header: 'Editar',
        styleClass: 'dialog-custom',
      },
    );

    this.socialNetworkModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Red social actualizada editado.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonDeleteSocialNetwork(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar esta red social?',
      header: 'Eliminar red social',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',

      accept: () => {
        this.socialNetworkService.delete(id).subscribe(() => {
          this.showSuccess('La red social ha sido eliminada');
        });
      },
      reject: () => {
        this.showError('No se eleminó la red social, intenteló nuevamente');
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
