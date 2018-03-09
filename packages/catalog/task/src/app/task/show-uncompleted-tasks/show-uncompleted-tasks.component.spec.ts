import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowUncompletedTasksComponent } from './show-uncompleted-tasks.component';

describe('ShowUncompletedTasksComponent', () => {
  let component: ShowUncompletedTasksComponent;
  let fixture: ComponentFixture<ShowUncompletedTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowUncompletedTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowUncompletedTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
