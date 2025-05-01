import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SharedModule } from '../../../../../../shared/shared.module';
import { ToastModule } from 'primeng/toast';
import { KeyFilterModule } from 'primeng/keyfilter';
import { MessageService } from 'primeng/api';
import { ImageModule } from 'primeng/image';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-products-ecommerce-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    SharedModule,
    ToastModule,
    KeyFilterModule,
    ImageModule,
    TooltipModule,
  ],
  templateUrl: './ecommerce-form.component.html',
  styleUrl: './ecommerce-form.component.scss',
  providers: [MessageService],
})
export class EcommerceFormComponent {
  productId: number = 0;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
  ) {
    if (this.route.snapshot.paramMap.get('id')) {
      this.productId = Number(this.route.snapshot.paramMap.get('id'));
    }
  }

  form: FormGroup = this.formBuilder.group({
    id: [null],
    percentageDiscount: ['', Validators.required],
    cashDiscount: ['', Validators.required],
  });

  saveProductButton() {}
}
