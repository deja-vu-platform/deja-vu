import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowScheduleComponent } from './show-schedule.component';

import { config } from '../testing/testbed.config';


describe('ShowScheduleComponent', () => {
  let component: ShowScheduleComponent;
  let fixture: ComponentFixture<ShowScheduleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
