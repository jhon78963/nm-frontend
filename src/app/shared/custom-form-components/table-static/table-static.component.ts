import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

// export interface ITableButtons {
//     size: "small" | "large" | undefined,
//     icon: string,
//     outlined: boolean,
//     pTooltip: string,
//     tooltipPosition: string,
//     click?:any,
// }

@Component({
  selector: 'app-table-static',
  templateUrl: './table-static.component.html',
  styleUrl: './table-static.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    TooltipModule,
  ],
})
export class TableStaticComponent {
  @Input()
  data: any[] = [];

  @Input()
  columns: any[] = [];

  @Input()
  callToAction: any[] = [];

  @Input()
  cellToAction: any;

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
