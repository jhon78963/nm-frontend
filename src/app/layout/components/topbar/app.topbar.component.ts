import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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
    private readonly router: Router,
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
    const tokenData = JSON.parse(localStorage.getItem('tokenData') || '{}');
    this.authService.logout(tokenData.refreshToken, tokenData.token).subscribe({
      next: () => this.clearSessionAndGoToLogin(),
      error: err => {
        console.error('Logout failed; clearing local session:', err);
        this.clearSessionAndGoToLogin();
      },
    });
  }

  private clearSessionAndGoToLogin(): void {
    localStorage.removeItem('tokenData');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedSize');
    this.router.navigate(['/auth/login']);
  }
}
