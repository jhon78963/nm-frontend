import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { Observable, take } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { CashComponent } from '../../../private/reservation/components/cash/cash.component';
import { CashService } from '../../../private/reservation/services/cash.service';
import { LayoutService } from '../../services/app.layout.service';
import { AppSidebarComponent } from '../sidebar/app.sidebar.component';
import { CashType } from '../../../private/reservation/models/cash.model';
import { FacilitiesService } from '../../../private/reservation/services/facilities.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './app.topbar.component.html',
  styleUrl: './app.topbar.component.scss',
  providers: [DialogService],
})
export class AppTopbarComponent implements OnInit {
  @ViewChild('menubutton') menuButton!: ElementRef;
  @ViewChild(AppSidebarComponent) appSidebar!: AppSidebarComponent;
  activeItem!: number;
  fakeImage: boolean = false;
  imgProfile = '';

  constructor(
    private readonly authService: AuthService,
    private readonly cashService: CashService,
    private readonly facilitiesService: FacilitiesService,
    private readonly dialogService: DialogService,
    private readonly router: Router,
    public el: ElementRef,
    public layoutService: LayoutService,
  ) {}

  ngOnInit(): void {
    this.cashService.getCashTotal().subscribe();
    this.cashService.getCashValidate().subscribe();
    this.facilitiesService.countFacilities().subscribe();
  }

  get employee(): Observable<string> {
    return this.cashService.getmployee();
  }

  get pettyCash(): Observable<number> {
    return this.cashService.getPettyCash();
  }

  get amount(): Observable<number> {
    return this.cashService.getAmount();
  }

  get cashAmount(): Observable<number> {
    return this.cashService.getCashAmount();
  }

  get cardAmount(): Observable<number> {
    return this.cashService.getCardAmount();
  }

  get total(): Observable<number> {
    return this.cashService.getTotal();
  }

  get cashType(): Observable<CashType> {
    return this.cashService.getCashType();
  }

  get countFacilities(): Observable<number> {
    return this.facilitiesService.getCount();
  }

  cash() {
    this.cashType.pipe(take(1)).subscribe({
      next: (cashType: CashType) => {
        this.dialogService.open(CashComponent, {
          header: cashType.label,
          data: {
            cashType,
            employee: this.employee,
            pettyCash: this.pettyCash,
            amount: this.amount,
            cashAmount: this.cashAmount,
            cardAmount: this.cardAmount,
            total: this.total,
          },
        });
      },
    });
  }

  onMenuButtonClick() {
    this.layoutService.onMenuToggle();
  }

  onSidebarButtonClick() {
    this.layoutService.showSidebar();
  }

  onConfigButtonClick() {
    this.layoutService.showConfigSidebar();
  }

  onLogout() {
    const tokenData = JSON.parse(localStorage.getItem('tokenData') || '{}');
    this.authService.logout(tokenData.refreshToken, tokenData.token).subscribe({
      next: () => {
        localStorage.removeItem('tokenData');
        localStorage.removeItem('user');
        this.router.navigate(['/auth/login']);
      },
      error: () => {},
    });
  }
}
