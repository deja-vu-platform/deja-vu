import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowUnassignedTasksComponent } from './show-unassigned-tasks.component';

describe('ShowUnassignedTasksComponent', () => {
  let component: ShowUnassignedTasksComponent;
  let fixture: ComponentFixture<ShowUnassignedTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowUnassignedTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowUnassignedTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
