import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StartCompoundTransactionButtonComponent } from './start-compound-transaction-button.component';

describe('StartCompoundTransactionButtonComponent', () => {
  let component: StartCompoundTransactionButtonComponent;
  let fixture: ComponentFixture<StartCompoundTransactionButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StartCompoundTransactionButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartCompoundTransactionButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
