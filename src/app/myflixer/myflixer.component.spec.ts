import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyflixerComponent } from './myflixer.component';

describe('MyflixerComponent', () => {
  let component: MyflixerComponent;
  let fixture: ComponentFixture<MyflixerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyflixerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MyflixerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
