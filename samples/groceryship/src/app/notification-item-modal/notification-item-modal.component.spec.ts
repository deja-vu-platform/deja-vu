import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationItemModalComponent } from './notification-item-modal.component';

describe('NotificationItemModalComponent', () => {
  let component: NotificationItemModalComponent;
  let fixture: ComponentFixture<NotificationItemModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotificationItemModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationItemModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
