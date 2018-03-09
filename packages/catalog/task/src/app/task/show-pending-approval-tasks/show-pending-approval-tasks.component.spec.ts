import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPendingApprovalTasksComponent } from './show-pending-approval-tasks.component';

describe('ShowPendingApprovalTasksComponent', () => {
  let component: ShowPendingApprovalTasksComponent;
  let fixture: ComponentFixture<ShowPendingApprovalTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowPendingApprovalTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPendingApprovalTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
