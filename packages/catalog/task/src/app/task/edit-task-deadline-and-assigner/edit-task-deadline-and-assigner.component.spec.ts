import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTaskDeadlineAndAssignerComponent } from './edit-task-deadline-and-assigner.component';

describe('EditTaskDeadlineAndAssignerComponent', () => {
  let component: EditTaskDeadlineAndAssignerComponent;
  let fixture: ComponentFixture<EditTaskDeadlineAndAssignerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditTaskDeadlineAndAssignerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTaskDeadlineAndAssignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
