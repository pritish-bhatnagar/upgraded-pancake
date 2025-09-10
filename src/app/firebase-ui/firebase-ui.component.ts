import { StepperOrientation } from '@angular/cdk/stepper';
import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable, map } from 'rxjs';
import {BreakpointObserver} from '@angular/cdk/layout';

@Component({
  selector: 'app-firebase-ui',
  templateUrl: './firebase-ui.component.html',
  styleUrls: ['./firebase-ui.component.scss']
})
export class FirebaseUiComponent {
  stepperOrientation: Observable<StepperOrientation>;

  constructor(
    private _formBuilder: FormBuilder,
    breakpointObserver: BreakpointObserver,
  ) {
    this.stepperOrientation = breakpointObserver
      .observe('(min-width: 800px)')
      .pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));
  }
}
