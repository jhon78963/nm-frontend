import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendorsRoutingModule } from './vendors-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabViewModule } from 'primeng/tabview';
import { TreeModule } from 'primeng/tree';
import { TreeTableModule } from 'primeng/treetable';
import { TabMenuModule } from 'primeng/tabmenu';
import { VendorsFormComponent } from './pages/form/vendors-form.component';

@NgModule({
  declarations: [VendorsFormComponent],
  imports: [
    CommonModule,
    VendorsRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    ConfirmDialogModule,
    TabViewModule,
    TreeModule,
    TreeTableModule,
    TabMenuModule,
  ],
  providers: [DialogService],
})
export class VendorsModule {}
