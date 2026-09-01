import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NasaSearchComponent } from './nasa/nasa-search/nasa-search.component';
import { NasaComponent } from './nasa/nasa.component';
import { NasaWmtsComponent } from './nasa-wmts/nasa-wmts.component';
import { AastaComponent } from './aasta/aasta.component';
import { HogsmeadeComponent } from './hogsmeade/hogsmeade.component';
import { DarcyComponent } from './darcy/darcy.component';
import { Soap2dayComponent } from './soap2day/soap2day.component';
import { StarryBackgroundComponent } from './starry-background/starry-background.component';
import { MyflixerComponent } from './myflixer/myflixer.component';
import { MyflixerLoginComponent } from './myflixer/auth/login/login.component';
import { MyflixerSignupComponent } from './myflixer/auth/signup/signup.component';
import { MyflixerAuthGuard } from './myflixer/auth/myflixer-auth.guard';
import { MyflixerProfileGuard } from './myflixer/auth/myflixer-profile.guard';
import { MyflixerProfileComponent } from './myflixer/profile/profile.component';
import { MyflixerWhoComponent } from './myflixer/who/who.component';
import { MyflixerManageProfilesComponent } from './myflixer/manage-profiles/manage-profiles.component';
import { MyflixerPlayerLabComponent } from './myflixer/player/player-lab.component';
import { MyflixerWatchComponent } from './myflixer/watch/watch.component';
import { MyflixerLiveChannelComponent } from './myflixer/live/live-channel.component';
import { MyflixerLiveGuidePageComponent } from './myflixer/live/live-guide-page.component';
import { StudioChannelsComponent } from './myflixer/studio/studio-channels.component';
import { StudioDashboardComponent } from './myflixer/studio/studio-dashboard.component';
import { StudioRequestsComponent } from './myflixer/studio/studio-requests.component';

const routes: Routes = [
  { path: 'search', component: NasaSearchComponent },
  { path: 'nasa', component: NasaComponent },
  { path: 'trek-map', component: NasaWmtsComponent },
  { path: '', component: AastaComponent },
  { path: 'shop', component: HogsmeadeComponent },
  { path: 'darcy', component: DarcyComponent },
  { path: 'soap2day', component: Soap2dayComponent },
  {path: 'stars' ,  component: StarryBackgroundComponent},
  {path : 'myflixer' , component: MyflixerComponent, canActivate: [MyflixerProfileGuard]},
  {path : 'myflixer/login' , component: MyflixerLoginComponent},
  {path : 'myflixer/signup' , component: MyflixerSignupComponent},
  {path : 'myflixer/who' , component: MyflixerWhoComponent, canActivate: [MyflixerAuthGuard]},
  {path : 'myflixer/manage-profiles' , component: MyflixerManageProfilesComponent, canActivate: [MyflixerAuthGuard]},
  {path : 'myflixer/profile' , component: MyflixerProfileComponent, canActivate: [MyflixerAuthGuard]},
  {path : 'myflixer/watch/:contentId' , component: MyflixerWatchComponent, canActivate: [MyflixerProfileGuard]},
  {path : 'myflixer/live' , component: MyflixerLiveGuidePageComponent, canActivate: [MyflixerProfileGuard]},
  {path : 'myflixer/live/:channelId' , component: MyflixerLiveChannelComponent, canActivate: [MyflixerProfileGuard]},
  {path : 'myflixer/studio' , component: StudioChannelsComponent, canActivate: [MyflixerAuthGuard]},
  {path : 'myflixer/studio/requests' , component: StudioRequestsComponent, canActivate: [MyflixerAuthGuard]},
  {path : 'myflixer/studio/:channelId' , component: StudioDashboardComponent, canActivate: [MyflixerAuthGuard]},
  {path : 'myflixer/player-lab' , component: MyflixerPlayerLabComponent},

  // { path: '**', redirectTo: '', pathMatch: 'full' }, // Redirect to AastaComponent for any unknown routes
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
