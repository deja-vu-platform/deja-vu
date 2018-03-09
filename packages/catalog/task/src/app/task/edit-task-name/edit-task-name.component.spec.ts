import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTaskNameComponent } from './edit-task-name.component';

describe('EditTaskNameComponent', () => {
  let component: EditTaskNameComponent;
  let fixture: ComponentFixture<EditTaskNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditTaskNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTaskNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
