import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ShowRequestTransactionComponent
} from './show-request-transaction.component';

describe('ShowRequestTransactionComponent', () => {
  let component: ShowRequestTransactionComponent;
  let fixture: ComponentFixture<ShowRequestTransactionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowRequestTransactionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowRequestTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
