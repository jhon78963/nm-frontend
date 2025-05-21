import { Component } from '@angular/core';
import { SharedModule } from '../../../../../../shared/shared.module';

@Component({
  selector: 'app-product-images',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './images.component.html',
  styleUrl: './images.component.scss',
})
export class ProductImagesComponent {}
