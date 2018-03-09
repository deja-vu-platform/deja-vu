import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTaskForAllAssigneesComponent } from './create-task-for-all-assignees.component';

describe('CreateTaskForAllAssigneesComponent', () => {
  let component: CreateTaskForAllAssigneesComponent;
  let fixture: ComponentFixture<CreateTaskForAllAssigneesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateTaskForAllAssigneesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateTaskForAllAssigneesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
