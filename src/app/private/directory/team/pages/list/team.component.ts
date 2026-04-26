import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TooltipModule } from 'primeng/tooltip';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, Observable } from 'rxjs';
import { TeamService } from '../../services/team.service';
import { LoadingService } from '../../../../../services/loading.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TeamFormComponent } from '../form/team-form.component';
import { TeamDailyAttendanceDialogComponent } from '../team-daily-attendance-dialog/team-daily-attendance-dialog.component';
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
    TooltipModule,
    RouterLink,
  ],
  providers: [ConfirmationService, MessageService, DialogService],
})
export class TeamListComponent implements OnInit, OnDestroy {
  teamModal: DynamicDialogRef | undefined;
  dailySummaryDialog?: DynamicDialogRef;
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
      click: (rowData: Team) => this.buttonAttendanceTeam(rowData),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-wallet',
      outlined: true,
      pTooltip: 'Pagos y descuentos',
      tooltipPosition: 'bottom',
      click: (rowData: Team) => this.buttonPayrollTeam(rowData),
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
    private readonly router: Router,
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
    this.teamModal?.close();
    this.dailySummaryDialog?.close();
  }

  openTeamDailySummary(): void {
    this.dailySummaryDialog = this.dialogService.open(
      TeamDailyAttendanceDialogComponent,
      {
        header: 'Asistencia del equipo por día',
        width: 'min(960px, 98vw)',
        maximizable: true,
        contentStyle: { overflow: 'auto' },
      },
    );
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
        if (value?.success && value?.login) {
          const L = value.login as {
            email: string;
            username: string;
            temporaryPassword: string;
          };
          this.showSuccess(
            `Colaborador creado. Usuario vendedora: ${L.email} · contraseña temporal: ${L.temporaryPassword}`,
            20000,
          );
        } else if (value?.success) {
          this.showSuccess('Colaborador creado.');
        } else if (value?.error) {
          this.showError(value.error);
        }
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

  buttonAttendanceTeam(rowData: Team): void {
    void this.router.navigate(['/directory/team/asistencia', rowData.id]);
  }

  buttonPayrollTeam(rowData: Team): void {
    void this.router.navigate(['/directory/team/pagos', rowData.id]);
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
          this.showSuccess('El colaborador ha sido eliminado');
        });
      },
      reject: () => {},
    });
  }

  showSuccess(message: string, life = 3000): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Confirmado',
      detail: message,
      life,
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
