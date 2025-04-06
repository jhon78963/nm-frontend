import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  output,
  SimpleChanges,
} from '@angular/core';
import { Size } from '../../../models/products.model';
import { SharedModule } from '../../../../../../shared/shared.module';
import { AutocompleteResponse } from '../../../../../../shared/models/autocomplete.interface';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ProductSizesService } from '../../../services/productSizes.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-size-table',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SharedModule,
    CommonModule,
    InputTextModule,
    ConfirmDialogModule,
  ],
  templateUrl: './sizes-table.component.html',
  styleUrl: './sizes-table.component.scss',
  providers: [ConfirmationService],
})
export class SizesTableComponent implements OnInit, OnChanges {
  @Input() addSizeEvent = new EventEmitter<void>();
  @Input() productId: number = 0;
  @Input() sizes: Size[] = [];
  @Input() parentForm!: FormGroup;
  productSizeSelected = output<any>();
  mainForm: FormGroup;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly productSizesService: ProductSizesService,
    private readonly confirmationService: ConfirmationService,
  ) {
    this.mainForm = this.formBuilder.group({
      sizes: this.formBuilder.array([this.createRow()]),
    });
  }

  ngOnInit(): void {
    this.addSizeEvent.subscribe(() => {
      this.addRow();
    });
    this.parentForm.setControl('productSizes', this.sizesArray);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sizes']?.currentValue) {
      const newSizes = changes['sizes'].currentValue;
      this.sizesArray.clear();
      newSizes.forEach((size: any) => {
        const row = this.createRow();
        row.patchValue(size);
        this.sizesArray.push(row);
      });
      this.addRow();
    }
  }

  updateParent() {
    const sizesValue = this.sizesArray.value;
    this.parentForm.get('productSizes')?.setValue(sizesValue);
  }

  get sizesArray(): FormArray {
    return this.mainForm.get('sizes') as FormArray;
  }

  createRow(): FormGroup {
    return this.formBuilder.group({
      size: ['', Validators.required],
      stock: ['', [Validators.required, Validators.min(0)]],
      price: ['', [Validators.required, Validators.min(0)]],
      colors: ['', Validators.required],
    });
  }

  addRow() {
    this.sizesArray.push(this.createRow());
  }

  deleteItem(productId: number, sizeId: number, index: number) {
    this.confirmationService.confirm({
      message: 'Deseas eliminar esta talla, se borrará definitivamente?',
      header: 'Eliminar talla',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',

      accept: () => {
        this.productSizesService.remove(productId, sizeId).subscribe({
          next: () => {
            this.sizesArray.removeAt(index);
          },
        });
      },
      reject: () => {},
    });
  }

  removeItem(sizeId: number, productId: number, index: number) {
    this.productSizesService.get(productId, sizeId).subscribe({
      next: (res: any) => {
        if (res.productSizeId) {
          this.deleteItem(productId, sizeId, index);
        } else {
          this.sizesArray.removeAt(index);
        }
      },
      error: () => {
        this.sizesArray.removeAt(index);
      },
    });
  }

  productSizeButton(
    sizeId: any,
    productId: number = 0,
    type: string = '',
    index: number = 0,
  ) {
    if (type == 'create') {
      this.productSizeSelected.emit({
        productSize: this.sizesArray.at(index).value,
        type,
      });
    } else {
      this.productSizeSelected.emit({ sizeId, productId, type });
    }
  }

  sendProductSize(type: string) {
    this.productSizeSelected.emit({ type });
  }

  getItemSelected(size: AutocompleteResponse, index: number) {
    this.sizesArray.at(index)?.get('size')?.setValue(size);
  }

  getItemsSelected(colors: AutocompleteResponse[], index: number) {
    this.sizesArray.at(index)?.get('colors')?.setValue(colors);
  }
}
