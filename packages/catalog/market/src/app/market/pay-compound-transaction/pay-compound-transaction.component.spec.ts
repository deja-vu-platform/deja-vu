import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PayCompoundTransactionComponent } from './pay-compound-transaction.component';

describe('PayCompoundTransactionComponent', () => {
  let component: PayCompoundTransactionComponent;
  let fixture: ComponentFixture<PayCompoundTransactionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PayCompoundTransactionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PayCompoundTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
