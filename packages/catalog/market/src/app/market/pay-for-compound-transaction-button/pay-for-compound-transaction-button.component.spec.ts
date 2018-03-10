import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PayForCompoundTransactionButtonComponent } from './pay-for-compound-transaction-button.component';

describe('PayForCompoundTransactionButtonComponent', () => {
  let component: PayForCompoundTransactionButtonComponent;
  let fixture: ComponentFixture<PayForCompoundTransactionButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PayForCompoundTransactionButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PayForCompoundTransactionButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
