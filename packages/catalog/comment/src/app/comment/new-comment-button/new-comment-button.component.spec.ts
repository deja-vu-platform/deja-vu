import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCommentButtonComponent } from './new-comment-button.component';

describe('NewCommentButtonComponent', () => {
  let component: NewCommentButtonComponent;
  let fixture: ComponentFixture<NewCommentButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewCommentButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewCommentButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
