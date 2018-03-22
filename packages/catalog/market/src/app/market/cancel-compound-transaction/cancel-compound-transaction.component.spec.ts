import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelCompoundTransactionComponent } from './cancel-compound-transaction.component';

describe('CancelCompoundTransactionComponent', () => {
  let component: CancelCompoundTransactionComponent;
  let fixture: ComponentFixture<CancelCompoundTransactionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CancelCompoundTransactionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CancelCompoundTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
