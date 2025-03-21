import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SocialNetworkListComponent } from './pages/list/social-network.component';

const routes: Routes = [
  { path: '', component: SocialNetworkListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'social-network' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SocialNetworkRoutingModule {}
