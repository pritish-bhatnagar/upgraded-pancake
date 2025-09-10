import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NasaSearchComponent } from './nasa-search.component';

describe('NasaSearchComponent', () => {
  let component: NasaSearchComponent;
  let fixture: ComponentFixture<NasaSearchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NasaSearchComponent]
    });
    fixture = TestBed.createComponent(NasaSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
