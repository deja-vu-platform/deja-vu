import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTasksForAssigneesComponent } from './create-tasks-for-assignees.component';

import { config } from '../testing/testbed.config';


describe('CreateTasksForAssigneesComponent', () => {
  let component: CreateTasksForAssigneesComponent;
  let fixture: ComponentFixture<CreateTasksForAssigneesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateTasksForAssigneesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should ', () => {
    expect(component).toBeTruthy();
  });
});
