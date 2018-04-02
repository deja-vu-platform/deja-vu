import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowDeliverRequestNotificationComponent } from './show-deliver-request-notification.component';

describe('ShowDeliverRequestNotificationComponent', () => {
  let component: ShowDeliverRequestNotificationComponent;
  let fixture: ComponentFixture<ShowDeliverRequestNotificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowDeliverRequestNotificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowDeliverRequestNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
