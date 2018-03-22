import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelTransactionComponent } from './cancel-transaction.component';

describe('CancelTransactionComponent', () => {
  let component: CancelTransactionComponent;
  let fixture: ComponentFixture<CancelTransactionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CancelTransactionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CancelTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
