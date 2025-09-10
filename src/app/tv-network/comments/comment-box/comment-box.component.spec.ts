import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentBoxComponent } from './comment-box.component';

describe('CommentBoxComponent', () => {
  let component: CommentBoxComponent;
  let fixture: ComponentFixture<CommentBoxComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CommentBoxComponent]
    });
    fixture = TestBed.createComponent(CommentBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
