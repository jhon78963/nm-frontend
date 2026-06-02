import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  userHasAnyPermission,
  userHasPermission,
} from '../../../auth/guards/permission.guard';
import { AuthService } from '../../../auth/services/auth.service';

type AppMenuItem = {
  label?: string;
  icon?: string;
  routerLink?: string[];
  separator?: boolean;
  permission?: string;
  permissions?: string[];
  items?: AppMenuItem[];
};

@Component({
  selector: 'app-menu',
  templateUrl: './app.menu.component.html',
  styleUrl: './app.menu.component.scss',
})
export class AppMenuComponent implements OnInit {
  model: AppMenuItem[] = [];
  lang = '';

  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly menuDefinition: AppMenuItem[] = [
    {
      label: 'Administración',
      icon: 'pi pi-home',
      items: [
        {
          label: 'Roles y permisos',
          icon: 'pi pi-fw pi-shield',
          routerLink: ['/administration/roles'],
          permission: 'role.getAll',
        },
        {
          label: 'Usuarios',
          icon: 'pi pi-fw pi-users',
          routerLink: ['/administration/users'],
          permission: 'user.getAll',
        },
        {
          label: 'Clientes (tenants)',
          icon: 'pi pi-fw pi-building',
          routerLink: ['/administration/tenants'],
          permission: 'tenant.getAll',
        },
        {
          label: 'Tiendas (warehouses)',
          icon: 'pi pi-fw pi-shopping-bag',
          routerLink: ['/administration/warehouses'],
          permission: 'warehouse.getAll',
        },
        {
          label: 'Historial de acciones',
          icon: 'pi pi-fw pi-history',
          routerLink: ['/administration/action-logs'],
          permission: 'audit.getAll',
        },
      ],
    },
    {
      label: 'Directorio',
      icon: 'pi pi-users',
      items: [
        {
          label: 'Equipo',
          icon: 'pi pi-fw pi-user',
          routerLink: ['/directory/team'],
          permissions: ['team.getAll', 'team.get'],
        },
        {
          label: 'Clientes',
          icon: 'pi pi-fw pi-user',
          routerLink: ['/directory/customers'],
          permissions: ['customer.getAll', 'customer.get'],
        },
        {
          label: 'Proveedores',
          icon: 'pi pi-fw pi-user',
          routerLink: ['/directory/vendors'],
          permissions: ['vendor.getAll', 'vendor.get'],
        },
      ],
    },
    {
      label: 'Inventario',
      icon: 'pi pi-home',
      items: [
        {
          label: 'Productos',
          icon: 'pi pi-fw pi-cog',
          routerLink: ['/inventories/products'],
          permissions: ['product.getAll', 'product.get'],
        },
        {
          label: 'Tallas',
          icon: 'pi pi-fw pi-cog',
          routerLink: ['/inventories/sizes'],
          permissions: ['size.getAll', 'size.get'],
        },
        {
          label: 'Colores',
          icon: 'pi pi-fw pi-cog',
          routerLink: ['/inventories/colors'],
          permissions: ['color.getAll', 'color.get'],
        },
        {
          label: 'Cuadre rápido',
          icon: 'pi pi-fw pi-table',
          routerLink: ['/inventories/reconciliation'],
          permission: 'inventoryReconciliation.search',
        },
      ],
    },
    {
      label: 'Compras',
      icon: 'pi pi-users',
      items: [
        {
          label: 'Lista',
          icon: 'pi pi-fw pi-shopping-cart',
          routerLink: ['/inventories/purchase'],
          permissions: ['purchase.getAll', 'purchase.get'],
        },
        {
          label: 'Registro',
          icon: 'pi pi-fw pi-calculator',
          routerLink: ['/inventories/purchase/register'],
          permission: 'purchase.registerBulk',
        },
      ],
    },
    {
      label: 'Ventas',
      icon: 'pi pi-users',
      items: [
        {
          label: 'POS',
          icon: 'pi pi-fw pi-money-bill',
          routerLink: ['/sales/pos'],
          permission: 'pos.checkout',
        },
        {
          label: 'Ventas',
          icon: 'pi pi-fw pi-shopping-bag',
          routerLink: ['/sales'],
          permissions: ['sale.getAll', 'sale.get'],
        },
        {
          label: 'Caja',
          icon: 'pi pi-fw pi-calculator',
          routerLink: ['/finance/cash-movements'],
          permission: 'cashflow.getDaily',
        },
      ],
    },
    {
      label: 'Gastos',
      icon: 'pi pi-users',
      items: [
        {
          label: 'Gastos Administrativos',
          icon: 'pi pi-fw pi-calculator',
          routerLink: ['/finance/cash-movements/admin-expenses'],
          permission: 'cashflow.getAdminMonthlyReport',
        },
      ],
    },
    {
      label: 'Reportes',
      icon: 'pi pi-users',
      items: [
        {
          label: 'Reportes',
          icon: 'pi pi-fw pi-user',
          routerLink: ['/reports'],
          permission: 'report.index',
        },
        {
          label: 'Productos (inventario)',
          icon: 'pi pi-fw pi-table',
          routerLink: ['/reports/products'],
          permission: 'report.products',
        },
        {
          label: 'Resumen Financiero',
          icon: 'pi pi-fw pi-user',
          routerLink: ['/financial-summary'],
          permission: 'financialSummary.getSummary',
        },
      ],
    },
  ];

  ngOnInit(): void {
    this.authService
      .ensureSessionLoaded()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.buildMenu());
  }

  /** Comprueba un permiso Spatie contra el usuario en memoria. Super Admin siempre pasa. */
  hasPermission(requiredPermission: string): boolean {
    return userHasPermission(
      this.authService.currentUser(),
      requiredPermission,
    );
  }

  private buildMenu(): void {
    this.model = this.filterMenuItems(this.menuDefinition);
  }

  private canShowMenuItem(item: AppMenuItem): boolean {
    if (item.permissions?.length) {
      return userHasAnyPermission(
        this.authService.currentUser(),
        item.permissions,
      );
    }

    if (item.permission) {
      return this.hasPermission(item.permission);
    }

    return true;
  }

  private filterMenuItems(items: AppMenuItem[]): AppMenuItem[] {
    return items
      .map(item => {
        if (item.items?.length) {
          const visibleChildren = this.filterMenuItems(item.items);
          if (visibleChildren.length === 0) {
            return null;
          }

          return { ...item, items: visibleChildren };
        }

        return this.canShowMenuItem(item) ? item : null;
      })
      .filter((item): item is AppMenuItem => item !== null);
  }
}
