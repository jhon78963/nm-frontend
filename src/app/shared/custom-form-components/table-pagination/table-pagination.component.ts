import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TreeTableModule } from 'primeng/treetable';
import { CallToAction } from '../../../interfaces/table.interface';
import { LoadingService } from '../../../services/loading.service';

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
    TagModule,
    TooltipModule,
    CheckboxModule,
    InputTextModule,
    ToastModule,
    TreeTableModule,
  ],
  providers: [MessageService],
})
export class TablePaginationComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadingService = inject(LoadingService);

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
  page: number = 1;

  @Input()
  rowsPerPageOptions: number[] = [10, 20, 50];

  @Output() paginateSelected = new EventEmitter<PaginatorState>();

  loading: boolean = false;

  ngOnInit(): void {
    this.loading = true;
    this.loadingService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(loading => {
        this.loading = loading;
      });
  }

  selectPageNumber(paginate: PaginatorState): void {
    this.loading = true;
    this.paginateSelected.emit(paginate);
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

  getVisibleActions(rowData: any): CallToAction<any>[] {
    return this.callToAction.filter(action => {
      if (!action.visible) return true;
      return action.visible(rowData);
    });
  }
}
