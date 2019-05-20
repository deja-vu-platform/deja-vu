import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowFollowerCountComponent } from './show-follower-count.component';

import { config } from '../testing/testbed.config';


describe('ShowFollowerCountComponent', () => {
  let component: ShowFollowerCountComponent;
  let fixture: ComponentFixture<ShowFollowerCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowFollowerCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
