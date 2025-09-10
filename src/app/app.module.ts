import { ApplicationConfig, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';


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
import { MessagesComponent } from './messages/messages.component';
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
import { TvNetworkModule } from './tv-network/tv-network.module';
// import { TvNetworkComponent } from './tv-network 1/tv-network.component';
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
    MessagesComponent,
    ExploreComponent,
    BottomsheetComponent,
    NasaComponent,
    NasaSearchComponent,
    NasaWmtsComponent,
    AastaComponent,
    HogsmeadeComponent,
    DarcyComponent,
    Soap2dayComponent,
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
    LottieModule.forRoot({ player: playerFactory })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
