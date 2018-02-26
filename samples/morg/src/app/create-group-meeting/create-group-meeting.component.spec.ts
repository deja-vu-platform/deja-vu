import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGroupMeetingComponent } from './create-group-meeting.component';

describe('CreateGroupMeetingComponent', () => {
  let component: CreateGroupMeetingComponent;
  let fixture: ComponentFixture<CreateGroupMeetingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateGroupMeetingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateGroupMeetingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
