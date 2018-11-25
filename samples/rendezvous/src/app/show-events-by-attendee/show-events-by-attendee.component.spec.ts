import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowEventsByAttendeeComponent } from './show-events-by-attendee.component';

describe('ShowEventsByAttendeeComponent', () => {
  let component: ShowEventsByAttendeeComponent;
  let fixture: ComponentFixture<ShowEventsByAttendeeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowEventsByAttendeeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowEventsByAttendeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
