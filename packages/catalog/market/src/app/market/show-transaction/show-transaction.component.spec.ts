import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTransactionComponent } from './show-transaction.component';

describe('ShowTransactionComponent', () => {
  let component: ShowTransactionComponent;
  let fixture: ComponentFixture<ShowTransactionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowTransactionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
