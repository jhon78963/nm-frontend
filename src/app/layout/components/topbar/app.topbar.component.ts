import { Component, ElementRef, ViewChild } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { AuthService } from '../../../auth/services/auth.service';
import { LayoutService } from '../../services/app.layout.service';
import { AppSidebarComponent } from '../sidebar/app.sidebar.component';

@Component({
  selector: 'app-topbar',
  templateUrl: './app.topbar.component.html',
  styleUrl: './app.topbar.component.scss',
  providers: [DialogService],
})
export class AppTopbarComponent {
  @ViewChild('menubutton') menuButton!: ElementRef;
  @ViewChild(AppSidebarComponent) appSidebar!: AppSidebarComponent;
  activeItem!: number;
  fakeImage: boolean = false;
  imgProfile = '';

  constructor(
    private readonly authService: AuthService,
    public el: ElementRef,
    public layoutService: LayoutService,
  ) {}

  onMenuButtonClick() {
    this.layoutService.onMenuToggle();
  }

  onSidebarButtonClick() {
    this.layoutService.showSidebar();
  }

  onConfigButtonClick() {
    this.layoutService.showConfigSidebar();
  }

  onLogout(): void {
    this.authService.signOut().subscribe();
  }
}
