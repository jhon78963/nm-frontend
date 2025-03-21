import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyFormComponent } from './pages/form/company-form.component';

const routes: Routes = [
  { path: '', component: CompanyFormComponent },
  { path: '', pathMatch: 'full', redirectTo: 'company' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CompanyRoutingModule {}
