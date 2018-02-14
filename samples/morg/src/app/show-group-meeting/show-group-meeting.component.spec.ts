import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowGroupMeetingComponent } from './show-group-meeting.component';

describe('ShowGroupMeetingComponent', () => {
  let component: ShowGroupMeetingComponent;
  let fixture: ComponentFixture<ShowGroupMeetingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowGroupMeetingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowGroupMeetingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
