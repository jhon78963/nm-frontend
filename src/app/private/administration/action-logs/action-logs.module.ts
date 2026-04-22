import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActionLogsRoutingModule } from './action-logs-routing.module';
import { ActionLogsListComponent } from './pages/list/action-logs.component';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [ActionLogsListComponent],
  imports: [
    CommonModule,
    ActionLogsRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class ActionLogsModule {}
