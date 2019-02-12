import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveTaskComponent } from './approve-task.component';

import { config } from '../testing/testbed.config';


describe('ApproveTaskComponent', () => {
  let component: ApproveTaskComponent;
  let fixture: ComponentFixture<ApproveTaskComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApproveTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
