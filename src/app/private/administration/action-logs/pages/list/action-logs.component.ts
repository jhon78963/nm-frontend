import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PaginatorState } from 'primeng/paginator';
import { debounceTime, Observable } from 'rxjs';
import { Column } from '../../../../../interfaces/table.interface';
import { LoadingService } from '../../../../../services/loading.service';
import { UserActionLog } from '../../models/action-logs.model';
import { ActionLogsService } from '../../services/action-logs.service';

@Component({
  selector: 'app-action-logs',
  templateUrl: './action-logs.component.html',
  styleUrl: './action-logs.component.scss',
})
export class ActionLogsListComponent implements OnInit {
  columns: Column[] = [];
  limit = 10;
  page = 1;
  search = '';

  formGroup = new FormGroup({
    search: new FormControl<string | null>(null),
  });

  constructor(
    private readonly actionLogsService: ActionLogsService,
    private readonly loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    this.columns = [
      { header: '#', field: 'id', clickable: false, image: false, money: false },
      { header: 'Fecha', field: 'creationTime', clickable: false, image: false, money: false },
      { header: 'Acción', field: 'action', clickable: false, image: false, money: false },
      { header: 'Usuario', field: 'userName', clickable: false, image: false, money: false },
      { header: 'Sucursal', field: 'warehouseId', clickable: false, image: false, money: false },
      { header: 'IP', field: 'ipAddress', clickable: false, image: false, money: false },
    ];
    this.load(this.limit, this.page, this.search);
    this.formGroup
      .get('search')
      ?.valueChanges.pipe(debounceTime(500))
      .subscribe(v => {
        this.search = v ?? '';
        this.loadingService.sendLoadingState(true);
        this.load(this.limit, 1, this.search);
      });
  }

  clearFilter(): void {
    this.search = '';
    this.loadingService.sendLoadingState(true);
    this.formGroup.get('search')?.setValue('');
  }

  load(limit = this.limit, page = this.page, q = this.search): void {
    this.page = page;
    this.actionLogsService.callGetList(limit, page, q).subscribe();
    setTimeout(() => this.loadingService.sendLoadingState(false), 500);
  }

  get rows(): Observable<UserActionLog[]> {
    return this.actionLogsService.getList();
  }

  get total(): Observable<number> {
    return this.actionLogsService.getTotal();
  }

  onPageSelected(event: PaginatorState): void {
    this.page = (event.page ?? 0) + 1;
    this.load(event.rows, this.page, this.search);
  }
}
