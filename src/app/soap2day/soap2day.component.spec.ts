import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Soap2dayComponent } from './soap2day.component';

describe('Soap2dayComponent', () => {
  let component: Soap2dayComponent;
  let fixture: ComponentFixture<Soap2dayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [Soap2dayComponent]
    });
    fixture = TestBed.createComponent(Soap2dayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
