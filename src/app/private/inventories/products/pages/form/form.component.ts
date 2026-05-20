import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { DialogService } from 'primeng/dynamicdialog';
import { KeyFilterModule } from 'primeng/keyfilter';
import { MessageService } from 'primeng/api';
import { StepsModule } from 'primeng/steps';
import { ToastModule } from 'primeng/toast';
import { filter } from 'rxjs';

@Component({
  selector: 'app-products-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    KeyFilterModule,
    StepsModule,
    ToastModule,
  ],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
  providers: [DialogService, MessageService],
})
export class StepperFormComponent implements OnInit {
  productId: number = 0;
  items: any[] = [];
  currentIndex: number = 0;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.initialProductId();
    this.uploadSteps();
    this.updateStepStatus();
    this.updateQueryParam();
  }

  initialProductId() {
    if (this.route.snapshot.firstChild) {
      this.productId = Number(
        this.route.snapshot.firstChild.paramMap.get('id'),
      );
    }
  }

  uploadSteps() {
    this.items = [
      {
        label: 'General',
        routerLink: [`/inventories/products/step/general/${this.productId}`],
      },
      {
        label: 'Tallas',
        routerLink: [`/inventories/products/step/sizes/${this.productId}`],
      },
      {
        label: 'Colores',
        routerLink: [`/inventories/products/step/colors/${this.productId}`],
      },
      {
        label: 'Ecommerce',
        routerLink: [`/inventories/products/step/ecommerce/${this.productId}`],
      },
      {
        label: 'Historial',
        routerLink: [`/inventories/products/step/history/${this.productId}`],
      },
    ];
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex -= 1;
      const link = this.items[this.currentIndex].routerLink?.[0];
      if (link) {
        this.router.navigate([link]);
      }
    }
  }

  next() {
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex += 1;
      const link = this.items[this.currentIndex].routerLink?.[0];
      if (link) {
        this.router.navigate([link]);
      }
    }
  }

  updateStepStatus() {
    const isDisabled = this.productId === 0;
    for (let i = 1; i < this.items.length; i++) {
      if (this.items[i]) {
        this.items[i].disabled = isDisabled;
      }
    }
  }

  private syncActiveIndexFromUrl(url: string): void {
    const stepSeg = url.match(/\/products\/step\/([^/?]+)/)?.[1];
    if (!stepSeg || !this.items.length) {
      return;
    }
    const idx = this.items.findIndex(step => {
      const link = (step.routerLink?.[0] as string | undefined) ?? '';
      const m = link.match(/\/step\/([^/]+)/);
      return m?.[1] === stepSeg;
    });
    if (idx >= 0) {
      this.currentIndex = idx;
    }
  }

  updateQueryParam() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        const navEnd = event as NavigationEnd;
        const url = navEnd.urlAfterRedirects || navEnd.url;
        const childRoute = this.route.firstChild;
        if (childRoute) {
          childRoute.paramMap.subscribe(params => {
            const id = Number(params.get('id'));
            this.productId = id;
            this.uploadSteps();
            this.updateStepStatus();
            this.syncActiveIndexFromUrl(url);
          });
        }
      });
  }
}
