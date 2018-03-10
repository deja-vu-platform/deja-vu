import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCompoundTransactionSellerComponent } from './edit-compound-transaction-seller.component';

describe('EditCompoundTransactionSellerComponent', () => {
  let component: EditCompoundTransactionSellerComponent;
  let fixture: ComponentFixture<EditCompoundTransactionSellerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditCompoundTransactionSellerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditCompoundTransactionSellerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
