import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAssigneeComponent } from './show-assignee.component';

describe('ShowAssigneeComponent', () => {
  let component: ShowAssigneeComponent;
  let fixture: ComponentFixture<ShowAssigneeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowAssigneeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowAssigneeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
