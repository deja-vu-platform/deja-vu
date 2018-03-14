import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssigneeSelectComponent } from './assignee-select.component';

describe('AssigneeSelectComponent', () => {
  let component: AssigneeSelectComponent;
  let fixture: ComponentFixture<AssigneeSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssigneeSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssigneeSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
