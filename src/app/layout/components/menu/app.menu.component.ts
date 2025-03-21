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
        // {
        //   label: 'Gestión',
        //   icon: 'pi pi-home',
        //   items: [
        //     {
        //       label: 'Empresa',
        //       icon: 'pi pi-fw pi-cog',
        //       routerLink: ['/management/company'],
        //     },
        //     {
        //       label: 'Redes Sociales',
        //       icon: 'pi pi-fw pi-users',
        //       routerLink: ['/management/social-network'],
        //     },
        //   ],
        // },
        {
          label: 'Instalaciones',
          icon: 'pi pi-home',
          items: [
            {
              label: 'Habitaciones',
              icon: 'pi pi-fw pi-cog',
              routerLink: ['/facility/room/list'],
            },
            {
              label: 'Lockers',
              icon: 'pi pi-fw pi-cog',
              routerLink: ['/facility/locker/list'],
            },
            {
              label: 'Inventario',
              icon: 'pi pi-fw pi-cog',
              routerLink: ['/facility/inventory/list'],
            },
          ],
        },
        {
          label: 'Reservaciones',
          icon: 'pi pi-home',
          items: [
            {
              label: 'Listado',
              icon: 'pi pi-fw pi-list',
              routerLink: ['/reservation/list'],
            },
            {
              label: 'Reservaciones',
              icon: 'pi pi-fw pi-book',
              routerLink: ['/reservation/book'],
            },
            {
              label: 'Reservas',
              icon: 'pi pi-fw pi-calendar',
              routerLink: ['/reservation/booking'],
            },
          ],
        },
        {
          label: 'Caja',
          icon: 'pi pi-home',
          items: [
            {
              label: 'Listado',
              icon: 'pi pi-fw pi-list',
              routerLink: ['/cash/list'],
            },
          ],
        },
      ];
    } else {
      this.model = [
        {
          label: 'Reservaciones',
          icon: 'pi pi-home',
          items: [
            {
              label: 'Listado',
              icon: 'pi pi-fw pi-list',
              routerLink: ['/reservation/list'],
            },
            {
              label: 'Reservaciones',
              icon: 'pi pi-fw pi-book',
              routerLink: ['/reservation'],
            },
            {
              label: 'Reservas',
              icon: 'pi pi-fw pi-calendar',
              routerLink: ['/reservation/booking'],
            },
          ],
        },
        {
          label: 'Caja',
          icon: 'pi pi-home',
          items: [
            {
              label: 'Listado',
              icon: 'pi pi-fw pi-list',
              routerLink: ['/cash/list'],
            },
          ],
        },
      ];
    }
  }
}
