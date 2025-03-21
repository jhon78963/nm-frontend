import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'company',
    title: 'Empresa',
    data: { breadcrumb: 'Empresa' },
    loadChildren: () =>
      import('./company/company.module').then(m => m.CompanyModule),
  },
  {
    path: 'social-network',
    title: 'Redes Sociales',
    data: { breadcrumb: 'Redes Sociales' },
    loadChildren: () =>
      import('./social-network/social-network.module').then(
        m => m.SocialNetworkModule,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'company' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManagementRoutingModule {}
