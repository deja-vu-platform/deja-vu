import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PayTransactionComponent } from './pay-transaction.component';

describe('PayTransactionComponent', () => {
  let component: PayTransactionComponent;
  let fixture: ComponentFixture<PayTransactionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PayTransactionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PayTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
