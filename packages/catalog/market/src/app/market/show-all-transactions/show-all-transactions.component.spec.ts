import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAllTransactionsComponent } from './show-all-transactions.component';

describe('ShowAllTransactionsComponent', () => {
  let component: ShowAllTransactionsComponent;
  let fixture: ComponentFixture<ShowAllTransactionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowAllTransactionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowAllTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
