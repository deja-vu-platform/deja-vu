import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAcceptRequestNotificationComponent } from './show-accept-request-notification.component';

describe('ShowAcceptRequestNotificationComponent', () => {
  let component: ShowAcceptRequestNotificationComponent;
  let fixture: ComponentFixture<ShowAcceptRequestNotificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowAcceptRequestNotificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowAcceptRequestNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
