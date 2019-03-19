import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputAssigneeComponent } from './input-assignee.component';

import { config } from '../testing/testbed.config';


describe('InputAssigneeComponent', () => {
  let component: InputAssigneeComponent;
  let fixture: ComponentFixture<InputAssigneeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputAssigneeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
