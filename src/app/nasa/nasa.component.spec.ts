import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NasaComponent } from './nasa.component';

describe('NasaComponent', () => {
  let component: NasaComponent;
  let fixture: ComponentFixture<NasaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NasaComponent]
    });
    fixture = TestBed.createComponent(NasaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
