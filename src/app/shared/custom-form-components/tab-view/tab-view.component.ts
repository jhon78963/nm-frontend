import { Component, Input } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabMenuModule } from 'primeng/tabmenu';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-tab-view',
  standalone: true,
  imports: [ConfirmDialogModule, TabMenuModule, ToastModule],
  templateUrl: './tab-view.component.html',
  styleUrl: './tab-view.component.scss',
  providers: [MessageService, ConfirmationService],
})
export class TabViewComponent {
  @Input() tabs: MenuItem[] = [];
  activeItem: MenuItem = this.tabs[0];
  constructor() {}
}
