import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserEventsComponent } from './user-events.component';

describe('UserEventsComponent', () => {
  let component: UserEventsComponent;
  let fixture: ComponentFixture<UserEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserEventsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
