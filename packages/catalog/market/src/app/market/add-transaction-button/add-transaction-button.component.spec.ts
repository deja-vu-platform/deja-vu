import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTransactionButtonComponent } from './add-transaction-button.component';

describe('AddTransactionButtonComponent', () => {
  let component: AddTransactionButtonComponent;
  let fixture: ComponentFixture<AddTransactionButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddTransactionButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTransactionButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
