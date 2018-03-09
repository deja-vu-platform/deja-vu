import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAssignedTasksComponent } from './show-assigned-tasks.component';

describe('ShowAssignedTasksComponent', () => {
  let component: ShowAssignedTasksComponent;
  let fixture: ComponentFixture<ShowAssignedTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowAssignedTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowAssignedTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
