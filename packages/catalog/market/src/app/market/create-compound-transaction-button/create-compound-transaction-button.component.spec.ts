import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCompoundTransactionButtonComponent } from './create-compound-transaction-button.component';

describe('CreateCompoundTransactionButtonComponent', () => {
  let component: CreateCompoundTransactionButtonComponent;
  let fixture: ComponentFixture<CreateCompoundTransactionButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateCompoundTransactionButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCompoundTransactionButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
