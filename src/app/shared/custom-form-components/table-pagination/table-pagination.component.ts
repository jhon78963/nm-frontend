import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { TreeTableModule } from 'primeng/treetable';
import { LoadingService } from '../../../services/loading.service';
import { CallToAction } from '../../../interfaces/table.interface';

@Component({
  selector: 'app-table-pagination',
  templateUrl: './table-pagination.component.html',
  styleUrl: './table-pagination.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    PaginatorModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    CheckboxModule,
    InputTextModule,
    ToastModule,
    TreeTableModule,
  ],
  providers: [MessageService],
})
export class TablePaginationComponent implements OnInit {
  @Input()
  data: any[] = [];

  @Input()
  columns: any[] = [];

  @Input()
  callToAction: any[] = [];

  @Input()
  cellToAction: any;

  @Input()
  total: number = 0;

  @Input()
  limit: number = 10;

  @Input()
  rowsPerPageOptions: number[] = [10, 20, 50];

  @Output() paginateSelected = new EventEmitter<PaginatorState>();

  loading: boolean = false;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadingService.loading$.subscribe(loading => {
      this.loading = loading;
    });
  }

  selectPageNumber(paginate: PaginatorState): void {
    this.loading = true;
    this.paginateSelected.emit(paginate);
    this.loadingService.loading$.subscribe(loading => {
      this.loading = loading;
    });
  }

  getButtonActions<T>(callToAction: CallToAction<T>[]): CallToAction<T>[] {
    return callToAction.filter(button => button.type === 'button');
  }

  getFieldValue(field: string, rowData: any): string {
    const fields = field.split('.');
    let value = rowData;
    for (const field of fields) {
      if (value && Object.prototype.hasOwnProperty.call(value, field)) {
        value = value[field];
      } else {
        return '';
      }
    }
    return value;
  }
}
