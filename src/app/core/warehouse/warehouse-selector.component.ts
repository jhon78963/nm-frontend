import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { filter, finalize, switchMap, tap } from 'rxjs';
import { isAdminOrSuperAdmin } from '../auth/permission.util';
import { AuthService } from '../../features/auth/data-access/auth.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import {
  ActiveWarehouseLookupService,
  SelectableWarehouse,
} from './active-warehouse-lookup.service';
import { ActiveWarehouseService } from './active-warehouse.service';

@Component({
  selector: 'app-warehouse-selector',
  imports: [FormsModule],
  template: `
    @if (visible()) {
      <label class="relative z-10 flex min-w-0 items-center gap-2">
        <span class="hidden text-xs font-medium text-gray-500 xl:inline">Almacén</span>
        <select
          class="max-w-[10rem] truncate rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 disabled:cursor-wait disabled:opacity-60 sm:max-w-[12rem]"
          [ngModel]="selectedId()"
          (ngModelChange)="onWarehouseChange($event)"
          [disabled]="loading()"
          aria-label="Almacén activo"
        >
          @for (warehouse of warehouses(); track warehouse.id) {
            <option [value]="warehouse.id">{{ warehouse.name }}</option>
          }
        </select>
      </label>
    }
  `,
})
export class WarehouseSelectorComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly activeWarehouseService = inject(ActiveWarehouseService);
  private readonly warehouseLookupService = inject(ActiveWarehouseLookupService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly warehouses = signal<SelectableWarehouse[]>([]);
  protected readonly loading = signal(false);

  protected readonly selectedId = computed(() =>
    this.activeWarehouseService.activeWarehouseId(),
  );

  protected readonly visible = computed(() => {
    if (!isAdminOrSuperAdmin(this.authService.currentUser())) {
      return false;
    }

    return this.loading() || this.warehouses().length > 1;
  });

  ngOnInit(): void {
    toObservable(this.authService.currentUser)
      .pipe(
        filter((user) => isAdminOrSuperAdmin(user)),
        tap(() => this.loading.set(true)),
        switchMap(() =>
          this.warehouseLookupService.loadSelectableWarehouses().pipe(
            finalize(() => this.loading.set(false)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (items) => {
          this.warehouses.set(items);
          this.syncActiveWarehouse(items);
        },
        error: () => {
          this.warehouses.set([]);
          this.toastService.show(
            'error',
            'No se pudieron cargar los almacenes disponibles.',
          );
        },
      });
  }

  protected onWarehouseChange(warehouseId: string): void {
    const next = warehouseId.trim();
    if (!next) return;

    const current = this.activeWarehouseService.getActiveWarehouseId();
    if (next === current) return;

    this.activeWarehouseService.setActiveWarehouseId(next);
    this.reloadCurrentRoute();
  }

  private syncActiveWarehouse(items: SelectableWarehouse[]): void {
    if (items.length === 0) {
      return;
    }

    const activeId = this.activeWarehouseService.getActiveWarehouseId();
    if (activeId && items.some((item) => item.id === activeId)) {
      return;
    }

    this.activeWarehouseService.setActiveWarehouseId(items[0].id);
  }

  private reloadCurrentRoute(): void {
    void this.router.navigateByUrl(this.router.url, {
      onSameUrlNavigation: 'reload',
    });
  }
}
