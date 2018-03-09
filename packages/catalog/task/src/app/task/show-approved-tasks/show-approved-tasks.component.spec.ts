import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowApprovedTasksComponent } from './show-approved-tasks.component';

describe('ShowApprovedTasksComponent', () => {
  let component: ShowApprovedTasksComponent;
  let fixture: ComponentFixture<ShowApprovedTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowApprovedTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowApprovedTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
