// src/app/shared/material.module.ts

import { NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; 
import { MatCheckboxModule } from '@angular/material/checkbox';

const materialModules = [
  MatFormFieldModule,
  MatInputModule,
  MatCardModule,
  MatButtonModule,
  MatToolbarModule,
  MatIconModule,
  MatSidenavModule,
  MatListModule,
  MatMenuModule,
  MatDialogModule,
  MatSnackBarModule,
  MatChipsModule,
  MatTabsModule,
  MatSelectModule,
  MatProgressSpinnerModule,
  MatTooltipModule,
  MatGridListModule,
  MatBadgeModule,
  MatExpansionModule,
  MatStepperModule,
  MatRadioModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatCheckboxModule
];

@NgModule({
  imports: materialModules,
  exports: materialModules,
})
export class MaterialModule {}