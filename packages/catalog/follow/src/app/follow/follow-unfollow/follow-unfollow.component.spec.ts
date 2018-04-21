import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowUnfollowComponent } from './follow-unfollow.component';

describe('FollowUnfollowComponent', () => {
  let component: FollowUnfollowComponent;
  let fixture: ComponentFixture<FollowUnfollowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FollowUnfollowComponent]
    })
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
