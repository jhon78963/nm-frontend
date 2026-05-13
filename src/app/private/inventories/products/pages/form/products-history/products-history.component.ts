import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
} from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { filter } from 'rxjs';
import { ProductsService } from '../../../services/products.service';

@Component({
  selector: 'app-product-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TimelineModule,
    CardModule,
    ButtonModule,
    RippleModule,
    TagModule,
  ],
  templateUrl: './products-history.component.html',
  styleUrl: './products-history.component.scss',
})
export class ProductHistoryComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  productsService = inject(ProductsService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  events = signal<any[]>([]);
  loading = signal<boolean>(true);

  stepper: boolean = true;

  ngOnInit() {
    this.syncStepperFromUrl(this.router.url);
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(event => {
        const nav = event as NavigationEnd;
        this.syncStepperFromUrl(nav.urlAfterRedirects ?? nav.url);
      });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pm => {
        const productIdRaw = pm.get('id');
        if (productIdRaw !== null && productIdRaw !== '') {
          this.loadHistory(Number(productIdRaw));
        }
      });
  }

  private syncStepperFromUrl(url: string): void {
    this.stepper = url.includes('/step/');
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
