import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowUnfollowComponent } from './follow-unfollow.component';

import { config } from '../testing/testbed.config';


describe('FollowUnfollowComponent', () => {
  let component: FollowUnfollowComponent;
  let fixture: ComponentFixture<FollowUnfollowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowUnfollowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
