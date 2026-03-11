import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { ProgressBarModule } from 'primeng/progressbar';
import { RippleModule } from 'primeng/ripple';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { catchError, forkJoin, of } from 'rxjs';
import { showError, showSuccess } from '../../../../../../utils/notifications';
import { ColorsCreateFormComponent } from '../../../../colors/pages/form/colors.component';
import { Size } from '../../../../sizes/models/sizes.model';
import { ProductSizeColorSave } from '../../../models/colors.interface';
import { ProductSizeColorsService } from '../../../services/productColors.service';

@Component({
  selector: 'app-colors-form',
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    DropdownModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    RippleModule,
    ColorPickerModule,
    MessagesModule,
    RouterLink,
    SelectButtonModule,
    ProgressBarModule,
  ],
  templateUrl: './colors-form.component.html',
  styleUrl: './colors-form.component.scss',
  providers: [DialogService, MessageService],
})
export class ColorsFormComponent implements OnInit {
  productId: number = 0;
  sizes: Size[] = [];
  colors = signal<any[]>([]);
  filterValue: any;
  selectedColors: any[] = [];
  selectedSize: any;
  stepper: boolean = true;

  searchTerm = signal<string>('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('active');

  totalAssignedStock = computed(() => {
    return this.colors().reduce(
      (acc, color) => acc + (Number(color.stock) || 0),
      0,
    );
  });

  remainingStock = computed(() => {
    const limit = this.selectedSize?.stock || 0;
    return limit - this.totalAssignedStock();
  });

  isStockBalanced = computed(() => {
    return this.totalAssignedStock() === (this.selectedSize?.stock || 0);
  });

  filteredColors = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.filterStatus();

    return this.colors()
      .filter(c => {
        const matchesSearch = c.description.toLowerCase().includes(term);
        const matchesStatus =
          status === 'all'
            ? true
            : status === 'active'
              ? c.isExists
              : !c.isExists;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => (b.isExists ? 1 : 0) - (a.isExists ? 1 : 0)); // Activos primero
  });

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
    private readonly productSizeColorsService: ProductSizeColorsService,
  ) {
    if (this.route.snapshot.paramMap.get('id')) {
      this.productId = Number(this.route.snapshot.paramMap.get('id'));
      this.stepper = this.router.url.includes('/step/');
    }
  }

  formGroup: FormGroup = new FormGroup({
    size: new FormControl(),
  });

  ngOnInit(): void {
    this.getSizes();
    this.loadColors();
    this.formGroup.get('size')?.valueChanges.subscribe((size: any) => {
      this.getSizes(size);
    });
  }

  loadColors() {
    const selectedSize = JSON.parse(localStorage.getItem('selectedSize')!);
    if (selectedSize && selectedSize.productId == this.productId) {
      this.selectedSize = {
        id: selectedSize.id,
        productSizeId: selectedSize.productSizeId,
        description: selectedSize.description,
        stock: selectedSize.stock,
      };
      this.getColors(this.selectedSize.id);
    } else {
      localStorage.removeItem('selectedSize');
    }
  }

  getSizes(size?: string) {
    this.productSizeColorsService.getSizes(this.productId, size).subscribe({
      next: (sizes: Size[]) => {
        this.sizes = sizes;
      },
    });
  }

  getColors(sizeId: number) {
    this.productSizeColorsService.getColors(this.productId, sizeId).subscribe({
      next: (colors: any) => {
        this.colors.set(colors);
      },
    });
  }

  getSelectedSize(event: any) {
    if (event.value) {
      event.value.productId = this.productId;
      localStorage.setItem('selectedSize', JSON.stringify(event.value));
      this.getColors(event.value.id);
    } else {
      this.messageService.clear();
      this.colors.set([]);
    }
  }

  resetFunction() {
    this.getSizes();
    this.formGroup.get('size')?.patchValue('');
  }

  selectColor(color: any) {
    const maxStock = this.selectedSize.stock;
    const totalSelected = this.selectedColors.reduce(
      (acc, curr) => acc + Number(curr.stock || 0),
      0,
    );

    const colorExists = this.selectedColors.find(c => c.id === color.id);
    const colorStock = Number(color.stock || 0);

    const isEmpty = !color.stock?.toString().trim();
    if (isEmpty) {
      this.selectedColors = this.selectedColors.filter(c => c.id !== color.id);
      this.messageService.clear();
      return;
    }

    if (colorExists) {
      const totalExcludingCurrent =
        totalSelected - Number(colorExists.stock || 0);
      if (totalExcludingCurrent + colorStock <= maxStock) {
        colorExists.stock = colorStock;
        this.messageService.clear();
      } else {
        this.messageService.clear();
        this.messageService.add({
          severity: 'warn',
          summary: 'Stock',
          detail: `Stock máximo alcanzado: ${this.selectedSize.stock}`,
        });
      }
    } else {
      if (totalSelected + colorStock <= maxStock) {
        this.selectedColors = [...this.selectedColors, color];
        this.messageService.clear();
      } else {
        this.messageService.clear();
        this.messageService.add({
          severity: 'warn',
          summary: 'Stock',
          detail: `No se puede seleccionar más tallas: stock maximo ${this.selectedSize.stock}`,
        });
      }
    }
  }

  onStockChange(color: any) {
    // 1. FORZAMOS LA REACTIVIDAD:
    // Actualizamos el signal con una copia del arreglo para que Angular detecte el cambio
    this.colors.update(currentColors => [...currentColors]);

    // 2. GESTIÓN DE SELECCIÓN AUTOMÁTICA:
    // Si tiene stock, asegúrate de que esté en selectedColors para el guardado masivo
    const isSelected = this.selectedColors.some(c => c.id === color.id);

    if (color.stock > 0 && !isSelected) {
      this.selectedColors = [...this.selectedColors, color];
    } else if ((color.stock === 0 || !color.stock) && isSelected) {
      this.selectedColors = this.selectedColors.filter(c => c.id !== color.id);
    }
  }

  createColor() {
    const modal = this.dialogService.open(ColorsCreateFormComponent, {
      data: {
        productId: this.productId,
      },
      header: 'Crear Color',
      styleClass: 'dialog-custom-form',
    });

    modal.onClose.subscribe({
      next: (value: any) => {
        if (value?.success) {
          showSuccess(this.messageService, 'Color Creado.');
          this.getSizes();
          this.loadColors();
        } else if (value?.error) {
          showError(this.messageService, 'Hubo un error, intente nuevamente');
        }
      },
    });
  }

  saveAllSelectedColors() {
    const requests = this.selectedColors.map(color => {
      const productSizeColorSave: ProductSizeColorSave = {
        stock: color.stock,
      };

      return this.productSizeColorsService
        .add(color.productSizeId, color.id, productSizeColorSave)
        .pipe(
          catchError(() => {
            return of(null);
          }),
        );
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.loadColors();
        this.selectedColors = [];
      },
    });
  }

  deleteAllSelectedColors() {
    const requests = this.selectedColors.map(color => {
      return this.productSizeColorsService
        .remove(color.productSizeId, color.id)
        .pipe(
          catchError(() => {
            return of(null);
          }),
        );
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.loadColors();
        this.selectedColors = [];
      },
    });
  }

  saveColorSizeProductButton(color: any) {
    const productSizeColorSave: ProductSizeColorSave = {
      stock: color.stock,
    };

    this.productSizeColorsService
      .add(color.productSizeId, color.id, productSizeColorSave)
      .subscribe({
        next: () => {
          this.loadColors();
          this.selectedColors = this.selectedColors.filter(
            c => c.id !== color.id,
          );
        },
        error: () => this.loadColors(),
      });
  }

  editColorSizeProductButton(color: any) {
    this.saveColorSizeProductButton(color);
  }

  removeColorSizeProductButton(color: any) {
    this.productSizeColorsService
      .remove(color.productSizeId, color.id)
      .subscribe({
        next: () => {
          this.loadColors();
          this.selectedColors = [];
        },
        error: () => this.loadColors(),
      });
  }
}
