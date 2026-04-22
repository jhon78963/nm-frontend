import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActionLogsListComponent } from './pages/list/action-logs.component';

const routes: Routes = [{ path: '', component: ActionLogsListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ActionLogsRoutingModule {}
