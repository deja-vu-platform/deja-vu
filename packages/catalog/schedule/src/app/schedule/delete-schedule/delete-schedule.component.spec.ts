import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteScheduleComponent } from './delete-schedule.component';

import { config } from '../testing/testbed.config';


describe('DeleteScheduleComponent', () => {
  let component: DeleteScheduleComponent;
  let fixture: ComponentFixture<DeleteScheduleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
