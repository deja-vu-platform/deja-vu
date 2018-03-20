import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCompoundTransactionComponent } from './create-compound-transaction.component';

describe('CreateCompoundTransactionComponent', () => {
  let component: CreateCompoundTransactionComponent;
  let fixture: ComponentFixture<CreateCompoundTransactionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateCompoundTransactionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCompoundTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
