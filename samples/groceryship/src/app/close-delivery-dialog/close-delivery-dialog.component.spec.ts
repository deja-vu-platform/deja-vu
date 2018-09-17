import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloseDeliveryDialogComponent } from './close-delivery-dialog.component';

describe('CloseDeliveryDialogComponent', () => {
  let component: CloseDeliveryDialogComponent;
  let fixture: ComponentFixture<CloseDeliveryDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloseDeliveryDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloseDeliveryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
