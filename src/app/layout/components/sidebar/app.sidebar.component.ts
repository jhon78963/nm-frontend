/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, ElementRef, ViewChild } from '@angular/core';
import { LayoutService } from '../../services/app.layout.service';
import { RouterModule } from '@angular/router';
import { AppMenuComponent } from '../menu/app.menu.component';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, AppMenuComponent],
  templateUrl: './app.sidebar.component.html',
  styleUrl: './app.sidebar.component.scss',
})
export class AppSidebarComponent {
  timeout: any = null;
  @ViewChild('menuContainer') menuContainer!: ElementRef;

  constructor(
    public layoutService: LayoutService,
    public el: ElementRef,
  ) {}

  onMouseEnter() {
    if (!this.layoutService.state.anchored) {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
      this.layoutService.state.sidebarActive = true;
    }
  }

  onMouseLeave() {
    if (!this.layoutService.state.anchored) {
      if (!this.timeout) {
        this.timeout = setTimeout(
          () => (this.layoutService.state.sidebarActive = false),
          300,
        );
      }
    }
  }

  anchor() {
    this.layoutService.state.anchored = !this.layoutService.state.anchored;
  }
}
