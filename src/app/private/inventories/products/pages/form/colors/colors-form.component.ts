import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { Size } from '../../../../size/models/sizes.model';
import { ProductSizeColorsService } from '../../../services/productColors.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';

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
  ],
  templateUrl: './colors-form.component.html',
  styleUrl: './colors-form.component.scss',
})
export class ColorsFormComponent implements OnInit {
  productId: number = 0;
  sizes: Size[] = [];
  colors: any[] = [];
  filterValue: any;
  selectedColors: any[] = [];
  createColor() {}
  saveAllSelectedColors() {}
  deleteAllSelectedColors() {}
  editColorSizeProductButton() {}
  saveColorSizeProductButton() {}
  removeColorSizeProductButton() {}

  constructor(
    private readonly route: ActivatedRoute,
    private readonly productSizeColorsService: ProductSizeColorsService,
  ) {
    if (this.route.snapshot.paramMap.get('id')) {
      this.productId = Number(this.route.snapshot.paramMap.get('id'));
    }
  }

  formGroup: FormGroup = new FormGroup({
    size: new FormControl(),
  });

  ngOnInit(): void {
    this.getSizes();
    this.formGroup.get('size')?.valueChanges.subscribe((size: any) => {
      this.getSizes(size);
    });
  }

  getSizes(size?: string) {
    this.productSizeColorsService.getSizes(this.productId, size).subscribe({
      next: (sizes: Size[]) => {
        this.sizes = sizes;
      },
    });
  }

  getColors(productSizeColorId: number) {
    this.productSizeColorsService.getColors(productSizeColorId).subscribe({
      next: (colors: any) => {
        this.colors = colors;
      },
    });
  }

  getSelectedSize(event: any) {
    if (event.value) {
      this.getColors(event.value.id);
    } else {
      this.colors = [];
    }
  }

  resetFunction() {
    this.getSizes();
    this.colors = [];
    this.formGroup.get('size')?.patchValue('');
  }

  selectColor(color: any) {
    console.log(color);
  }
}
