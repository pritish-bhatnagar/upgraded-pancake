import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NasaSearchComponent } from './nasa/nasa-search/nasa-search.component';
import { MessagesComponent } from './messages/messages.component';
import { NasaComponent } from './nasa/nasa.component';
import { NasaWmtsComponent } from './nasa-wmts/nasa-wmts.component';
import { AastaComponent } from './aasta/aasta.component';
import { HogsmeadeComponent } from './hogsmeade/hogsmeade.component';
import { DarcyComponent } from './darcy/darcy.component';
import { Soap2dayComponent } from './soap2day/soap2day.component';

const routes: Routes = [
  { path: 'search', component: NasaSearchComponent },
  { path: 'messages', component: MessagesComponent },
  { path: 'nasa', component: NasaComponent },
  { path: 'trek-map', component: NasaWmtsComponent },
  { path: '', component: AastaComponent },
  { path: 'shop', component: HogsmeadeComponent },
  { path: 'darcy', component: DarcyComponent },
  { path: 'soap2day', component: Soap2dayComponent },
  
    {
      path: 'tv-network',
      loadChildren: () =>
        import('./tv-network/tv-network.module').then(m => m.TvNetworkModule)
    },
    // { path: '', redirectTo: '/tv-network/auth/login', pathMatch: 'full' }
  
  // { path: '**', redirectTo: '', pathMatch: 'full' }, // Redirect to AastaComponent for any unknown routes
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
