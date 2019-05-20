import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateScheduleComponent } from './create-schedule.component';

import { config } from '../testing/testbed.config';


describe('CreateScheduleComponent', () => {
  let component: CreateScheduleComponent;
  let fixture: ComponentFixture<CreateScheduleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
