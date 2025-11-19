import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { Size } from '../../models/sizes.model';
import { DialogService } from 'primeng/dynamicdialog';
import { LoadingService } from '../../../../../services/loading.service';
import { SizesService } from '../../services/sizes.service';
import { PaginatorState } from 'primeng/paginator';
import { Observable } from 'rxjs';
import { RouterModule } from '@angular/router';
import { SizesSelectedService } from '../../services/sizes-selected.service';

@Component({
  selector: 'app-sizes',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    ConfirmDialogModule,
    SharedModule,
    RouterModule,
  ],
  templateUrl: './sizes.component.html',
  styleUrl: './sizes.component.scss',
  providers: [ConfirmationService, DialogService, MessageService],
})
export class SizeListComponent implements OnInit {
  columns: Column[] = [
    {
      header: '#',
      field: 'id',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Talla',
      field: 'description',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Tipo de Talla',
      field: 'sizeType',
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
  cellToAction: any;
  limit: number = 10;
  page: number = 1;
  name: string = '';
  sizeTypes: Size[] = [];
  selectedSizeTypeId: number = 1;
  callToAction: CallToAction<Size>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Size) => this.editSizeButton(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Size, event?: Event) =>
        this.deleteSizeButton(rowData.id, event!),
    },
  ];

  constructor(
    private readonly loadingService: LoadingService,
    private readonly sizesService: SizesService,
    private readonly sizesSelectedService: SizesSelectedService,
  ) {}

  ngOnInit(): void {
    this.getSizes(this.limit, this.page, this.name);
    this.getSizeTypes();
  }

  async getSizes(
    limit = this.limit,
    page = this.page,
    name = this.name,
  ): Promise<void> {
    this.updatePage(page);
    this.sizesService.callGetList(limit, page, name).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  getSizeTypes() {
    this.sizesSelectedService.getSizeTypes().subscribe({
      next: (sizeTypes: Size[]) => {
        this.sizeTypes = sizeTypes;
      },
    });
  }

  selectFilter(sizeTypeId: number) {
    this.selectedSizeTypeId = sizeTypeId;
  }

  async onPageSelected(paginate: PaginatorState): Promise<void> {
    this.updatePage((paginate.page ?? 0) + 1);
    this.getSizes(paginate.rows, this.page);
  }

  get sizes(): Observable<Size[]> {
    return this.sizesService.getList();
  }

  get total(): Observable<number> {
    return this.sizesService.getTotal();
  }

  addSizeButton() {
    console.log('add size button');
  }

  editSizeButton(id: number) {
    console.log('edit size button', id);
  }

  deleteSizeButton(id: number, event: Event) {
    console.log('delete size button', id, event);
  }

  private updatePage(value: number): void {
    this.page = value;
  }
}
