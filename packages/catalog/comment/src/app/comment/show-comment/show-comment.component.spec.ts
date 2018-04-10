import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowCommentComponent } from './show-comment.component';

describe('ShowCommentComponent', () => {
  let component: ShowCommentComponent;
  let fixture: ComponentFixture<ShowCommentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShowCommentComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
