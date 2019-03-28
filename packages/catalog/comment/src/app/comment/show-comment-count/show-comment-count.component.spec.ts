import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowCommentCountComponent } from './show-comment-count.component';

import { config } from '../testing/testbed.config';


describe('ShowCommentCountComponent', () => {
  let component: ShowCommentCountComponent;
  let fixture: ComponentFixture<ShowCommentCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowCommentCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
