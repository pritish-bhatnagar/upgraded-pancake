import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Needed for forms
import { RouterModule } from '@angular/router'; // For *ngIf routerLink, etc.

import { TvNetworkRoutingModule } from './tv-network-routing.module';

import { AdminComponent } from './admin/admin/admin.component';
import { UploadContentComponent } from './admin/upload-content/upload-content.component';
import { ManageScheduleComponent } from './admin/manage-schedule/manage-schedule.component';

import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';

import { DashboardComponent } from './user/dashboard/dashboard.component';
import { HomeComponent } from './user/home/home.component';
import { MediaFeedComponent } from './user/media-feed/media-feed.component';
import { ContentDetailComponent } from './user/content-detail/content-detail.component';
import { ProfileComponent } from './user/profile/profile.component';

import { NavbarComponent } from './shared/navbar/navbar.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';

import { CommentBoxComponent } from './comments/comment-box/comment-box.component';

// Firebase & Services (if using firebase packages directly)
import { AuthService } from './shared/auth.service';
import { FirebaseService } from './shared/firebase.service';
import { CommentService } from './comments/comment.service';

import { AuthGuard } from './auth/auth.guard';
import { RoleGuard } from './shared/role.guard';
import { AppModule } from '../app.module';
import { MaterialModule } from '../material/material.module';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [
    AdminComponent,
    UploadContentComponent,
    ManageScheduleComponent,
    LoginComponent,
    SignupComponent,
    ForgotPasswordComponent,
    DashboardComponent,
    HomeComponent,
    MediaFeedComponent,
    ContentDetailComponent,
    ProfileComponent,
    NavbarComponent,
    SidebarComponent,
    CommentBoxComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TvNetworkRoutingModule,
    MaterialModule,
    MatCardModule
  ],
  providers: [
    AuthService,
    FirebaseService,
    CommentService,
    AuthGuard,
    RoleGuard,
  ]
})
export class TvNetworkModule {}