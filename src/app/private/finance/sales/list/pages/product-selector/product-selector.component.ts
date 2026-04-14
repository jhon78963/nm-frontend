import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PosService } from '../../../pos/services/pos.service';

@Component({
  selector: 'app-product-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
  ],
  templateUrl: './product-selector.component.html',
  styleUrl: './product-selector.component.scss',
})
export class ProductSelectorComponent implements OnInit {
  private ref = inject(DynamicDialogRef);
  private posService = inject(PosService);

  // Usamos una señal para la lista
  products = signal<any[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loadProducts(''); // Carga inicial
  }

  // Captura el input del buscador
  search(event: any) {
    const query = (event.target as HTMLInputElement).value;
    if (query.length > 2 || query.length === 0) {
      this.loadProducts(query);
    }
  }

  // Conectamos con el Backend
  async loadProducts(query: string) {
    if (!query) {
      this.products.set([]);
      return;
    }

    this.loading.set(true);
    try {
      const res = await this.posService.searchProductBySku(query);

      if (res && res.variants) {
        const flatVariants: any[] = [];

        // Recorremos las llaves del objeto (XS, M, ESTÁNDAR...)
        Object.keys(res.variants).forEach(sizeName => {
          const variantsOfSize = res.variants[sizeName];

          variantsOfSize.forEach((v: any) => {
            flatVariants.push({
              ...v,
              name: res.name, // Nombre base del producto
              size_name: sizeName, // Nombre de la talla (la llave del objeto)
              // Si el precio de la variante es 0, usamos el basePrice del producto
              sale_price: v.price > 0 ? v.price : res.basePrice,
            });
          });
        });

        this.products.set(flatVariants);
      } else {
        this.products.set([]);
      }
    } catch (error) {
      console.error('Error cargando productos', error);
      this.products.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  select(product: any) {
    // Cerramos el modal devolviendo el objeto seleccionado
    this.ref.close(product);
  }
}
