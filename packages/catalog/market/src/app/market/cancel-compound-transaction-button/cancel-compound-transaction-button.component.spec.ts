import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelCompoundTransactionButtonComponent } from './cancel-compound-transaction-button.component';

describe('CancelCompoundTransactionButtonComponent', () => {
  let component: CancelCompoundTransactionButtonComponent;
  let fixture: ComponentFixture<CancelCompoundTransactionButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CancelCompoundTransactionButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CancelCompoundTransactionButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
