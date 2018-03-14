import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAssigneeComponent } from './create-assignee.component';

describe('CreateAssigneeComponent', () => {
  let component: CreateAssigneeComponent;
  let fixture: ComponentFixture<CreateAssigneeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateAssigneeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAssigneeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
