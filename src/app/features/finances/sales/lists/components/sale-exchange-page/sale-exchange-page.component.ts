import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastService } from '../../../../../../shared/ui/toast/toast.service';
import { ExchangeResponse } from '../../models/sale.model';
import { SaleExchangeComponent } from '../sale-exchange/sale-exchange.component';

@Component({
  selector: 'app-sale-exchange-page',
  imports: [SaleExchangeComponent],
  template: `
    @if (saleId(); as id) {
      <app-sale-exchange
        [saleId]="id"
        (close)="goBack()"
        (exchangeCompleted)="onExchangeCompleted($event)"
      />
    }
  `,
})
export class SaleExchangePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saleId = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.saleId.set(params.get('id'));
    });
  }

  protected goBack(): void {
    void this.router.navigate(['/finances/sales']);
  }

  protected onExchangeCompleted(response: ExchangeResponse): void {
    this.toastService.show('success', response.message || 'Canje registrado correctamente.');
    this.goBack();
  }
}
