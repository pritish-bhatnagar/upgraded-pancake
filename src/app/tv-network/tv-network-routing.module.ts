import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';

import { DashboardComponent } from './user/dashboard/dashboard.component';
import { HomeComponent } from './user/home/home.component';
import { MediaFeedComponent } from './user/media-feed/media-feed.component';
import { ContentDetailComponent } from './user/content-detail/content-detail.component';
import { ProfileComponent } from './user/profile/profile.component';

import { AdminComponent } from './admin/admin/admin.component';
import { UploadContentComponent } from './admin/upload-content/upload-content.component';
import { ManageScheduleComponent } from './admin/manage-schedule/manage-schedule.component';

import { AuthGuard } from './auth/auth.guard';
import { RoleGuard } from './shared/role.guard';

const routes: Routes = [
  { path: '', redirectTo: 'user/home', pathMatch: 'full' },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/signup', component: SignupComponent },
  { path: 'auth/forgot-password', component: ForgotPasswordComponent },

  {
    path: 'admin',

    canActivate: [AuthGuard],
    children: [
      { path: '', component: AdminComponent },
      { path: 'upload', component: UploadContentComponent },
      { path: 'schedule', component: ManageScheduleComponent },
    ],
  },

  {
    path: 'user',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'home', component: HomeComponent },
      { path: 'media/:id', component: ContentDetailComponent },
      { path: 'feed', component: MediaFeedComponent },
      { path: 'profile', component: ProfileComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TvNetworkRoutingModule {}
