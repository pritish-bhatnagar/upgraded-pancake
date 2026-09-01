import { ApplicationConfig, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AdsenseModule } from 'ng2-adsense';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import {MatDialogModule} from '@angular/material/dialog';
import { TwitterComponent } from './twitter/twitter.component';
import { FirebaseComponent } from './firebase/firebase.component';
import { FirebaseUiComponent } from './firebase-ui/firebase-ui.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {StepperOrientation, MatStepperModule} from '@angular/material/stepper';
import { AsyncPipe } from '@angular/common';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { ExploreComponent } from './explore/explore.component';
import { BottomsheetComponent } from './bottomsheet/bottomsheet.component';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatExpansionModule} from '@angular/material/expansion';
import { NasaComponent } from './nasa/nasa.component';
import { HttpClientModule } from '@angular/common/http';
import { NasaSearchComponent } from './nasa/nasa-search/nasa-search.component';
import { NasaWmtsComponent } from './nasa-wmts/nasa-wmts.component';
import { AastaComponent } from './aasta/aasta.component';
import { HogsmeadeComponent } from './hogsmeade/hogsmeade.component';
import { MatSelectModule } from '@angular/material/select';
import { DarcyComponent } from './darcy/darcy.component';
import { Soap2dayComponent } from './soap2day/soap2day.component';
// import { CarouselModule } from 'primeng';
// import { ButtonModule } from 'primeng/button';

// import { ToolbarModule } from 'primeng/toolbar/toolbar';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
// import { CarouselModule } from 'primeng/carousel';
// import { providePrimeNG } from 'primeng/config';
// import Aura from '@primeuix/themes/dist/aura';

// ngx-lottie
import { LottieModule } from 'ngx-lottie';
import player from 'lottie-web';
import { StarryBackgroundComponent } from './starry-background/starry-background.component';
import { MyflixerComponent } from './myflixer/myflixer.component';
import { SafePipe } from './myflixer/safe.pipe';
import { MyflixerLoginComponent } from './myflixer/auth/login/login.component';
import { MyflixerSignupComponent } from './myflixer/auth/signup/signup.component';
import { MyflixerProfileComponent } from './myflixer/profile/profile.component';
import { MyflixerWhoComponent } from './myflixer/who/who.component';
import { MyflixerManageProfilesComponent } from './myflixer/manage-profiles/manage-profiles.component';
import { VideoPlayerComponent } from './myflixer/player/video-player.component';
import { MyflixerPlayerLabComponent } from './myflixer/player/player-lab.component';
import { MyflixerWatchComponent } from './myflixer/watch/watch.component';
import { MyflixerLiveChannelComponent } from './myflixer/live/live-channel.component';
import { LiveGuideComponent } from './myflixer/live/live-guide.component';
import { MyflixerLiveGuidePageComponent } from './myflixer/live/live-guide-page.component';
import { StudioChannelsComponent } from './myflixer/studio/studio-channels.component';
import { StudioDashboardComponent } from './myflixer/studio/studio-dashboard.component';
import { StudioRequestsComponent } from './myflixer/studio/studio-requests.component';
// import { ButtonModule } from 'primeng/button';
export function playerFactory() {
  return player;
}


// export const appConfig: ApplicationConfig = {
//   providers: [
//       provideAnimations(),
//       providePrimeNG({
//           theme: {
//               preset: Aura
//           }
//       })
//   ]
// };

@NgModule({
  declarations: [
    AppComponent,
    TwitterComponent,
    FirebaseComponent,
    FirebaseUiComponent,
    ExploreComponent,
    BottomsheetComponent,
    NasaComponent,
    NasaSearchComponent,
    NasaWmtsComponent,
    AastaComponent,
    HogsmeadeComponent,
    DarcyComponent,
    StarryBackgroundComponent,
    MyflixerComponent,
    MyflixerLoginComponent,
    MyflixerSignupComponent,
    MyflixerProfileComponent,
    MyflixerWhoComponent,
    MyflixerManageProfilesComponent,
    VideoPlayerComponent,
    MyflixerPlayerLabComponent,
    MyflixerWatchComponent,
    MyflixerLiveChannelComponent,
    LiveGuideComponent,
    StudioChannelsComponent,
    StudioDashboardComponent,
    StudioRequestsComponent,
    MyflixerLiveGuidePageComponent

    // TvNetworkComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AdsenseModule.forRoot(),
    BrowserAnimationsModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    FormsModule,
    MatToolbarModule, 
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    ReactiveFormsModule,
    AsyncPipe,
    MatSlideToggleModule,
    MatGridListModule,
    MatExpansionModule,
    HttpClientModule,
    MatCardModule,
    MatTabsModule,
    MatChipsModule,
    MatSelectModule,
    // CarouselModule,
    // ButtonModule,
    MatToolbarModule,
    SafePipe,
    LottieModule.forRoot({ player: playerFactory }),
    
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
