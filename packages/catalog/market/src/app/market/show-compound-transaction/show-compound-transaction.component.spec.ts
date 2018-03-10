import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowCompoundTransactionComponent } from './show-compound-transaction.component';

describe('ShowCompoundTransactionComponent', () => {
  let component: ShowCompoundTransactionComponent;
  let fixture: ComponentFixture<ShowCompoundTransactionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowCompoundTransactionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowCompoundTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
