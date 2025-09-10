import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AastaComponent } from './aasta.component';

describe('AastaComponent', () => {
  let component: AastaComponent;
  let fixture: ComponentFixture<AastaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AastaComponent]
    });
    fixture = TestBed.createComponent(AastaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
