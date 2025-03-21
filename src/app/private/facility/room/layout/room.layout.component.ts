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
  templateUrl: './room.layout.component.html',
  styleUrl: './room.layout.component.scss',
  providers: [MessageService, ConfirmationService],
})
export class RoomLayoutComponent {
  tabs: MenuItem[] = [
    {
      id: '1',
      label: 'Habitaciones',
      routerLink: ['./list'],
    },
    {
      id: '2',
      label: 'Tipo de Habitaciones',
      routerLink: ['./room-types'],
    },
    {
      id: '3',
      label: 'Comodidades',
      routerLink: ['./amenities'],
    },
    {
      id: '4',
      label: 'Tarifario',
      routerLink: ['./rate'],
    },
    {
      id: '5',
      label: 'Comentarios',
      routerLink: ['./reviews'],
    },
    {
      id: '6',
      label: 'Images',
      routerLink: ['./images'],
    },
  ];
  activeItem: MenuItem = this.tabs[0];
}
