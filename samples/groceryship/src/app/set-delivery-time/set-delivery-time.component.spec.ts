import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetDeliveryTimeComponent } from './set-delivery-time.component';

describe('SetDeliveryTimeComponent', () => {
  let component: SetDeliveryTimeComponent;
  let fixture: ComponentFixture<SetDeliveryTimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetDeliveryTimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetDeliveryTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
