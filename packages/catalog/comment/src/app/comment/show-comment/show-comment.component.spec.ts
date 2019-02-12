import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowCommentComponent } from './show-comment.component';

import { config } from '../testing/testbed.config';


describe('ShowCommentComponent', () => {
  let component: ShowCommentComponent;
  let fixture: ComponentFixture<ShowCommentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
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
