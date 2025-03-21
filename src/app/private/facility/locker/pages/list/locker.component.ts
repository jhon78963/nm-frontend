import { Component, OnInit } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { SharedModule } from '../../../../../shared/shared.module';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { Locker } from '../../models/locker.model';
import { CommonModule } from '@angular/common';
import { DialogService } from 'primeng/dynamicdialog';
import { LockersService } from '../../services/lockers.service';
import { debounceTime, Observable, Subject } from 'rxjs';
import { LoadingService } from '../../../../../services/loading.service';
import { PaginatorState } from 'primeng/paginator';
import { MessageService } from 'primeng/api';
import { LockerFormComponent } from '../form/locker-form.component';

@Component({
  selector: 'app-lockers',
  standalone: true,
  imports: [CommonModule, ToastModule, SharedModule],
  templateUrl: './locker.component.html',
  styleUrl: './locker.component.scss',
  providers: [DialogService, MessageService],
})
export class LockerListComponent implements OnInit {
  columns: Column[] = [
    {
      header: 'Género',
      field: 'gender',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Número',
      field: 'number',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Precio',
      field: 'price',
      clickable: false,
      image: false,
      money: true,
    },
    {
      header: 'Estado',
      field: 'status',
      clickable: false,
      image: false,
      money: false,
    },
    // {
    //   field: 'button',
    //   header: 'Acción',
    //   clickable: false,
    //   image: false,
    //   money: false,
    // },
  ];
  cellToAction: any;
  data: any[] = [];
  limit: number = 10;
  page: number = 1;
  description: string = '';
  callToAction: CallToAction<Locker>[] = [];

  private searchTermSubject = new Subject<string>();

  constructor(
    private readonly dialogService: DialogService,
    private readonly lockersService: LockersService,
    private readonly loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    this.getLockers(this.limit, this.page, this.description);
    this.searchTermSubject.pipe(debounceTime(600)).subscribe(() => {
      this.loadingService.sendLoadingState(true);
      this.getLockers(this.limit, this.page, this.description);
    });
  }

  clearFilter(): void {
    this.description = '';
    this.onSearchTermChange('');
  }

  onSearchTermChange(term: any): void {
    this.searchTermSubject.next(term);
  }

  async getLockers(
    limit = this.limit,
    page = this.page,
    description = this.description,
  ): Promise<void> {
    this.updatePage(page);
    this.lockersService.callGetList(limit, page, description).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getLockers(event.rows, this.page);
  }

  get lockers(): Observable<Locker[]> {
    return this.lockersService.getList();
  }

  get total(): Observable<number> {
    return this.lockersService.getTotal();
  }

  updateLockerButton() {
    const modal = this.dialogService.open(LockerFormComponent, {
      header: 'Actualizar precio',
    });

    modal.onClose.subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.getLockers();
        }
      },
    });
  }

  private updatePage(value: number): void {
    this.page = value;
  }
}
