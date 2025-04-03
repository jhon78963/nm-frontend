import { Component, EventEmitter, Input, OnInit, output } from '@angular/core';
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

@Component({
  selector: 'app-size-table',
  standalone: true,
  imports: [ReactiveFormsModule, SharedModule, CommonModule, InputTextModule],
  templateUrl: './sizes-table.component.html',
  styleUrl: './sizes-table.component.scss',
})
export class SizesTableComponent implements OnInit {
  @Input() addSizeEvent = new EventEmitter<void>();
  @Input() productId: number = 0;
  @Input() sizes: Size[] = [];
  @Input() parentForm!: FormGroup;
  productSizeSelected = output<any>();
  mainForm: FormGroup;

  constructor(private readonly formBuilder: FormBuilder) {
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

  removeItem(index: number) {
    this.sizesArray.removeAt(index);
  }

  productSizeButton(
    sizeId: number = 0,
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

  showRow() {
    console.log(this.mainForm.value);
  }

  // get sizesForm(): FormArray {
  //   return this.form.get('sizes') as FormArray;
  // }
}
