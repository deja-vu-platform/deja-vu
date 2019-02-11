import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompleteTaskComponent } from './complete-task.component';

import { config } from '../testing/testbed.config';


describe('CompleteTaskComponent', () => {
  let component: CompleteTaskComponent;
  let fixture: ComponentFixture<CompleteTaskComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompleteTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
