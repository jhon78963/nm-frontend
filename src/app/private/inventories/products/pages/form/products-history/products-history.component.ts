import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProductsService } from '../../../services/products.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-history',
  standalone: true,
  imports: [CommonModule, TimelineModule, CardModule, ButtonModule, TagModule],
  templateUrl: './products-history.component.html',
  styles: [
    `
      .custom-marker {
        display: flex;
        width: 2rem;
        height: 2rem;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        border-radius: 50%;
        z-index: 1;
      }
      ::ng-deep .p-timeline-event-content {
        padding-bottom: 2rem;
      }
      ::ng-deep .p-timeline-event-opposite {
        flex: 0;
        padding: 0 !important;
      }
    `,
  ],
})
export class ProductHistoryComponent implements OnInit {
  productsService = inject(ProductsService);
  route = inject(ActivatedRoute);

  events = signal<any[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    // Obtenemos el ID del producto pasado al modal
    const productId = this.route.snapshot.params['id'];

    if (productId) {
      this.loadHistory(productId);
    }
  }

  loadHistory(id: number) {
    this.loading.set(true);
    // Asegúrate de agregar getHistory(id) en tu ProductsService
    this.productsService.getHistory(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.events.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
