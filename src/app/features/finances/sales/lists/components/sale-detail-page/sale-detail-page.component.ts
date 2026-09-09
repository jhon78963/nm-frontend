import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../../auth/data-access/auth.service';
import { ToastService } from '../../../../../../shared/ui/toast/toast.service';
import { SaleFormComponent } from '../sale-form/sale-form.component';

@Component({
  selector: 'app-sale-detail-page',
  imports: [SaleFormComponent],
  template: `
    @if (saleId()) {
      <app-sale-form
        [saleId]="saleId()"
        [readOnly]="readOnly()"
        (saved)="onSaved($event)"
        (closed)="goBack()"
      />
    }
  `,
})
export class SaleDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saleId = signal<string | null>(null);

  protected readonly readOnly = computed(() => {
    if (this.route.snapshot.queryParamMap.get('mode') === 'view') {
      return true;
    }

    return !this.authService.hasPermission('sale.update');
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.saleId.set(params.get('id'));
    });
  }

  protected goBack(): void {
    void this.router.navigate(['/finances/sales']);
  }

  protected onSaved(message: string): void {
    this.toastService.show('success', message);
    this.goBack();
  }
}
