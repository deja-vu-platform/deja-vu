import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateScheduleComponent } from './update-schedule.component';

import { config } from '../testing/testbed.config';


describe('UpdateScheduleComponent', () => {
  let component: UpdateScheduleComponent;
  let fixture: ComponentFixture<UpdateScheduleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
