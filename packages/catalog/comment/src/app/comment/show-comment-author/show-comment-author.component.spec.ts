import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowCommentAuthorComponent } from './show-comment-author.component';

describe('ShowCommentAuthorComponent', () => {
  let component: ShowCommentAuthorComponent;
  let fixture: ComponentFixture<ShowCommentAuthorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowCommentAuthorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowCommentAuthorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
