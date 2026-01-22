import { OnInit } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  selector: 'app-menu',
  templateUrl: './app.menu.component.html',
  styleUrl: './app.menu.component.scss',
})
export class AppMenuComponent implements OnInit {
  model: any[] = [];
  lang: any = '';

  getUserData() {
    const jsonData = localStorage.getItem('user');
    const userData = jsonData ? JSON.parse(jsonData) : undefined;
    return userData.role;
  }

  ngOnInit(): void {
    const isAdmin = this.getUserData();
    if (isAdmin == 'Admin') {
      this.model = [
        {
          label: 'Administración',
          icon: 'pi pi-home',
          items: [
            {
              label: 'Roles',
              icon: 'pi pi-fw pi-cog',
              routerLink: ['/administration/roles'],
            },
            {
              label: 'Usuarios',
              icon: 'pi pi-fw pi-users',
              routerLink: ['/administration/users'],
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
            },
            {
              label: 'Clientes',
              icon: 'pi pi-fw pi-user',
              routerLink: ['/directory/customers'],
            },
            {
              label: 'Proveedores',
              icon: 'pi pi-fw pi-user',
              routerLink: ['/directory/vendors'],
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
            },
            {
              label: 'Tallas',
              icon: 'pi pi-fw pi-cog',
              routerLink: ['/inventories/sizes'],
            },
            {
              label: 'Colores',
              icon: 'pi pi-fw pi-cog',
              routerLink: ['/inventories/colors'],
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
            },
            {
              label: 'Ventas',
              icon: 'pi pi-fw pi-shopping-bag',
              routerLink: ['/sales'],
            },
            {
              label: 'Caja',
              icon: 'pi pi-fw pi-calculator',
              routerLink: ['/finance/cash-movements'],
            },
            {
              label: 'Gastos',
              icon: 'pi pi-fw pi-calculator',
              routerLink: ['/finance/expenses'],
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
            },
            {
              label: 'Resumen Financiero',
              icon: 'pi pi-fw pi-user',
              routerLink: ['/financial-summary'],
            },
          ],
        },
      ];
    } else {
      this.model = [
        {
          label: 'Ventas',
          icon: 'pi pi-users',
          items: [
            {
              label: 'POS',
              icon: 'pi pi-fw pi-money-bill',
              routerLink: ['/sales/pos'],
            },
            {
              label: 'Caja',
              icon: 'pi pi-fw pi-calculator',
              routerLink: ['/finance/cash-movements'],
            },
          ],
        },
      ];
    }
  }
}
