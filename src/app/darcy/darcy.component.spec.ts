import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DarcyComponent } from './darcy.component';

describe('DarcyComponent', () => {
  let component: DarcyComponent;
  let fixture: ComponentFixture<DarcyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DarcyComponent]
    });
    fixture = TestBed.createComponent(DarcyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
