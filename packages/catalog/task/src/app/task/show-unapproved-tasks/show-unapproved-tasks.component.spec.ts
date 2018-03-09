import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowUnapprovedTasksComponent } from './show-unapproved-tasks.component';

describe('ShowUnapprovedTasksComponent', () => {
  let component: ShowUnapprovedTasksComponent;
  let fixture: ComponentFixture<ShowUnapprovedTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowUnapprovedTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowUnapprovedTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
