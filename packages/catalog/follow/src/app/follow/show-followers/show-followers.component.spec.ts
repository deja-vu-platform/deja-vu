import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowFollowersComponent } from './show-followers.component';

import { config } from '../testing/testbed.config';


describe('ShowFollowersComponent', () => {
  let component: ShowFollowersComponent;
  let fixture: ComponentFixture<ShowFollowersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowFollowersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
