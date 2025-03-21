import { Component } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabMenuModule } from 'primeng/tabmenu';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-room.layout',
  standalone: true,
  imports: [ConfirmDialogModule, TabMenuModule, ToastModule, TabViewModule],
  templateUrl: './rate.layout.component.html',
  styleUrl: './rate.layout.component.scss',
  providers: [MessageService, ConfirmationService],
})
export class RateLayoutComponent {
  tabs: MenuItem[] = [
    {
      id: '1',
      label: 'Tarifarios',
      routerLink: ['./list'],
    },
    {
      id: '2',
      label: 'Horas',
      routerLink: ['./hours'],
    },
    {
      id: '3',
      label: 'Días',
      routerLink: ['./days'],
    },
  ];
  activeItem: MenuItem = this.tabs[0];
}
