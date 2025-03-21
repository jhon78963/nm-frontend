import { NgModule } from '@angular/core';
import { AppLayoutComponent } from './layout/app.layout.component';
import { ButtonModule } from 'primeng/button';
import { AppBreadcrumbComponent } from './components/breadcrumb/app.breadcrumb.component';
import { AppTopbarComponent } from './components/topbar/app.topbar.component';
import { AppSidebarComponent } from './components/sidebar/app.sidebar.component';
import { StyleClassModule } from 'primeng/styleclass';
import { AppMenuComponent } from './components/menu/app.menu.component';
import { AppMenuitemComponent } from './components/menu/app.menuitem.component';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SidebarModule } from 'primeng/sidebar';
import { TooltipModule } from 'primeng/tooltip';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { RippleModule } from 'primeng/ripple';
import { InputSwitchModule } from 'primeng/inputswitch';
import { BadgeModule } from 'primeng/badge';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    AppLayoutComponent,
    AppBreadcrumbComponent,
    AppSidebarComponent,
    AppTopbarComponent,
    AppMenuComponent,
    AppMenuitemComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    StyleClassModule,
    InputTextModule,
    SidebarModule,
    BadgeModule,
    RadioButtonModule,
    InputSwitchModule,
    TooltipModule,
    RippleModule,
    RouterModule,
    ButtonModule,
    DropdownModule,
  ],
})
export class AppLayoutModule {}
