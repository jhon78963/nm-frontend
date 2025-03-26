import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProductsService } from '../../services/products.service';
import { GendersService } from '../../../../../services/genders.service';
import { Gender } from '../../../../../models/gender.interface';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-products-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule],
  templateUrl: './products-form.component.html',
  styleUrl: './products-form.component.scss',
})
export class ProductsFormComponent implements OnInit {
  productId: number = 0;
  genders: Gender[] = [];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly productsService: ProductsService,
    private readonly gendersService: GendersService,
  ) {}

  form: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    purchasePrice: ['', Validators.required],
    wholesalePrice: ['', Validators.required],
    minWholesalePrice: ['', Validators.required],
    ratailPrice: ['', Validators.required],
    minRatailPrice: [null, Validators.required],
    genderId: [null, Validators.required],
  });

  ngOnInit(): void {
    this.gendersService.getAll().subscribe((genders: Gender[]) => {
      this.genders = genders;
    });
  }

  saveProductButton() {}
}
