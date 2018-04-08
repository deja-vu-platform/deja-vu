import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCommentTextComponent } from './new-comment-text.component';

describe('NewCommentTextComponent', () => {
  let component: NewCommentTextComponent;
  let fixture: ComponentFixture<NewCommentTextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewCommentTextComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewCommentTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
