import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddToBalanceComponent } from './add-to-balance.component';

describe('AddToBalanceComponent', () => {
  let component: AddToBalanceComponent;
  let fixture: ComponentFixture<AddToBalanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddToBalanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddToBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
