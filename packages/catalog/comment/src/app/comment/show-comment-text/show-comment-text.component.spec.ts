import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowCommentTextComponent } from './show-comment-text.component';

describe('ShowCommentTextComponent', () => {
  let component: ShowCommentTextComponent;
  let fixture: ComponentFixture<ShowCommentTextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowCommentTextComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowCommentTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
