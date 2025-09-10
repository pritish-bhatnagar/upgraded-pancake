import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HogsmeadeComponent } from './hogsmeade.component';

describe('HogsmeadeComponent', () => {
  let component: HogsmeadeComponent;
  let fixture: ComponentFixture<HogsmeadeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HogsmeadeComponent]
    });
    fixture = TestBed.createComponent(HogsmeadeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
