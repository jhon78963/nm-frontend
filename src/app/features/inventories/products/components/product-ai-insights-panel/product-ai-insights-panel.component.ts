import { DecimalPipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiPredictionService } from '../../../../ai/data-access/ai-prediction.service';
import {
  AiProductContext,
  DEFAULT_HORIZON_DAYS,
  DemandPredictionResult,
  PriceOptimizationResult,
} from '../../../../ai/models/ai-prediction.model';
import { AlertComponent } from '../../../../../shared/ui/alert/alert.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';

@Component({
  selector: 'app-product-ai-insights-panel',
  imports: [
    DecimalPipe,
    RouterLink,
    ReactiveFormsModule,
    AlertComponent,
    ButtonComponent,
    InputComponent,
  ],
  providers: [AiPredictionService],
  templateUrl: './product-ai-insights-panel.component.html',
})
export class ProductAiInsightsPanelComponent {
  private readonly aiPredictionService = inject(AiPredictionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly productId = input.required<string>();

  protected readonly horizonDays = signal(DEFAULT_HORIZON_DAYS);
  protected readonly horizonDaysControl = new FormControl(String(DEFAULT_HORIZON_DAYS), {
    nonNullable: true,
  });

  protected readonly productContext = signal<AiProductContext | null>(null);
  protected readonly contextLoading = signal(false);
  protected readonly contextError = signal<string | null>(null);

  protected readonly priceLoading = signal(false);
  protected readonly demandLoading = signal(false);
  protected readonly priceResult = signal<PriceOptimizationResult | null>(null);
  protected readonly demandResult = signal<DemandPredictionResult | null>(null);
  protected readonly priceError = signal<string | null>(null);
  protected readonly demandError = signal<string | null>(null);

  protected readonly canSubmitPrice = computed(() => {
    const context = this.productContext();
    return (
      context != null &&
      context.canViewCost &&
      context.currentCost > 0 &&
      context.category.trim().length > 0 &&
      !this.contextLoading() &&
      !this.priceLoading()
    );
  });

  protected readonly canSubmitDemand = computed(() => {
    const context = this.productContext();
    const days = this.horizonDays();

    return (
      context != null &&
      !this.contextLoading() &&
      !this.demandLoading() &&
      days >= 1 &&
      days <= 365
    );
  });

  protected readonly priceDelta = computed(() => {
    const context = this.productContext();
    const result = this.priceResult();
    if (!context || !result) {
      return null;
    }

    return result.suggestedPrice - context.salePrice;
  });

  protected readonly restockUrgency = computed(() => {
    const result = this.demandResult();
    if (!result) {
      return 'neutral' as const;
    }

    if (result.suggestedPurchaseQuantity <= 0) {
      return 'ok' as const;
    }
    if (result.suggestedPurchaseQuantity >= 20) {
      return 'high' as const;
    }
    return 'medium' as const;
  });

  constructor() {
    effect(() => {
      const productId = this.productId().trim();
      if (!productId) {
        return;
      }

      this.resetPredictions();
      this.loadProductContext(productId);
    });

    this.horizonDaysControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.updateHorizonDays(value));
  }

  protected submitPriceOptimization(): void {
    const context = this.productContext();
    if (!context || !this.canSubmitPrice()) {
      return;
    }

    this.priceLoading.set(true);
    this.priceError.set(null);
    this.priceResult.set(null);

    this.aiPredictionService
      .optimizePrice(context.productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.priceResult.set(result);
          this.priceLoading.set(false);
        },
        error: (message: string) => {
          this.priceError.set(message);
          this.priceLoading.set(false);
        },
      });
  }

  protected submitDemandPrediction(): void {
    const context = this.productContext();
    if (!context || !this.canSubmitDemand()) {
      return;
    }

    this.demandLoading.set(true);
    this.demandError.set(null);
    this.demandResult.set(null);

    this.aiPredictionService
      .predictDemand(context.productId, this.horizonDays())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.demandResult.set(result);
          this.demandLoading.set(false);
        },
        error: (message: string) => {
          this.demandError.set(message);
          this.demandLoading.set(false);
        },
      });
  }

  private resetPredictions(): void {
    this.priceResult.set(null);
    this.demandResult.set(null);
    this.priceError.set(null);
    this.demandError.set(null);
  }

  private updateHorizonDays(value: string): void {
    const parsed = value.trim() === '' ? DEFAULT_HORIZON_DAYS : Number(value);
    this.horizonDays.set(
      Number.isFinite(parsed)
        ? Math.min(365, Math.max(1, Math.trunc(parsed)))
        : DEFAULT_HORIZON_DAYS,
    );
    this.horizonDaysControl.setValue(String(this.horizonDays()), { emitEvent: false });
    this.demandResult.set(null);
    this.demandError.set(null);
  }

  private loadProductContext(productId: string): void {
    this.contextLoading.set(true);
    this.contextError.set(null);
    this.productContext.set(null);

    this.aiPredictionService
      .getProductContext(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (context) => {
          this.productContext.set(context);
          this.contextLoading.set(false);
        },
        error: (message: string) => {
          this.contextError.set(message);
          this.contextLoading.set(false);
        },
      });
  }
}
