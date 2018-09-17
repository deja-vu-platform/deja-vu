import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetDeliveryTimeDialogComponent } from './set-delivery-time-dialog.component';

describe('SetDeliveryTimeDialogComponent', () => {
  let component: SetDeliveryTimeDialogComponent;
  let fixture: ComponentFixture<SetDeliveryTimeDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetDeliveryTimeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetDeliveryTimeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
