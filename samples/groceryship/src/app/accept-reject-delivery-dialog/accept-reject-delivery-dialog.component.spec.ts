import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  AcceptRejectDeliveryDialogComponent
} from './accept-reject-delivery-dialog.component';

describe('AcceptRejectDeliveryDialogComponent', () => {
  let component: AcceptRejectDeliveryDialogComponent;
  let fixture: ComponentFixture<AcceptRejectDeliveryDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AcceptRejectDeliveryDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptRejectDeliveryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
