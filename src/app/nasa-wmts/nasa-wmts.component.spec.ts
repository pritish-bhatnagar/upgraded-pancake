import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NasaWmtsComponent } from './nasa-wmts.component';

describe('NasaWmtsComponent', () => {
  let component: NasaWmtsComponent;
  let fixture: ComponentFixture<NasaWmtsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NasaWmtsComponent]
    });
    fixture = TestBed.createComponent(NasaWmtsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
