import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SocialNetworkRoutingModule } from './social-network-routing.module';
import { SocialNetworkListComponent } from './pages/list/social-network.component';
import { SocialNetworkFormComponent } from './pages/form/social-network-form.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { DialogService } from 'primeng/dynamicdialog';

@NgModule({
  declarations: [SocialNetworkListComponent, SocialNetworkFormComponent],
  imports: [
    CommonModule,
    SocialNetworkRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [DialogService],
})
export class SocialNetworkModule {}
