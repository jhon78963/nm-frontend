import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { debounceTime, Observable } from 'rxjs';
import { TeamService } from '../../services/team.service';
import { LoadingService } from '../../../../../services/loading.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TeamFormComponent } from '../form/team-form.component';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { Team } from '../../models/team.model';
import { PaginatorState } from 'primeng/paginator';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AttendanceFormComponent } from '../attendance-form/attendance-form.component';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmDialogModule,
    ToastModule,
    SharedModule,
  ],
  providers: [ConfirmationService, MessageService],
})
export class TeamListComponent implements OnInit, OnDestroy {
  teamModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  data: any[] = [];
  limit: number = 10;
  page: number = 1;
  name: string = '';
  callToAction: CallToAction<Team>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Team) => this.buttonEditTeam(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-calendar',
      outlined: true,
      pTooltip: 'Asistencia',
      tooltipPosition: 'bottom',
      click: (rowData: Team) => this.buttonAttendanceTeam(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Team, event?: Event) =>
        this.buttonDeleteTeam(rowData.id, event!),
    },
  ];

  formGroup: FormGroup = new FormGroup({
    search: new FormControl<string | null>(null),
  });

  constructor(
    private readonly dialogService: DialogService,
    private readonly teamService: TeamService,
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
        header: 'Salario',
        field: 'salary',
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

    this.getTeam(this.limit, this.page, this.name);
    this.formGroup
      .get('search')
      ?.valueChanges.pipe(debounceTime(600))
      .subscribe((value: any) => {
        this.name = value ? value : '';
        this.loadingService.sendLoadingState(true);
        this.getTeam(this.limit, this.page, this.name);
      });
  }

  ngOnDestroy(): void {
    if (this.teamModal) {
      this.teamModal.close();
    }
  }

  clearFilter(): void {
    this.name = '';
    this.loadingService.sendLoadingState(true);
    this.formGroup.get('search')?.setValue('');
  }

  private updatePage(value: number): void {
    this.page = value;
  }

  async getTeam(
    limit = this.limit,
    page = this.page,
    name = this.name,
  ): Promise<void> {
    this.updatePage(page);
    this.teamService.callGetList(limit, page, name).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  get team(): Observable<Team[]> {
    return this.teamService.getList();
  }

  get total(): Observable<number> {
    return this.teamService.getTotal();
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getTeam(event.rows, this.page);
  }

  buttonAddTeam(): void {
    this.teamModal = this.dialogService.open(TeamFormComponent, {
      data: {},
      header: 'Crear',
    });

    this.teamModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Colaborador Creado.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonEditTeam(id: number): void {
    this.teamModal = this.dialogService.open(TeamFormComponent, {
      data: {
        id,
      },
      header: 'Editar',
    });

    this.teamModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Colaborador actualizado.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonAttendanceTeam(id: number): void {
    this.teamModal = this.dialogService.open(AttendanceFormComponent, {
      data: {
        id,
      },
      header: 'Asistencia',
    });

    this.teamModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Colaborador actualizado.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonDeleteTeam(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar este colaborador?',
      header: 'Eliminar colaborador',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      acceptLabel: 'Si',
      rejectLabel: 'No',
      accept: () => {
        this.teamService.delete(id).subscribe(() => {
          this.showSuccess('El rol ha sido eliminado');
        });
      },
      reject: () => {},
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
