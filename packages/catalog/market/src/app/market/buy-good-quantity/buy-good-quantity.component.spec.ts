import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyGoodQuantityComponent } from './buy-good-quantity.component';

describe('BuyGoodQuantityComponent', () => {
  let component: BuyGoodQuantityComponent;
  let fixture: ComponentFixture<BuyGoodQuantityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuyGoodQuantityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyGoodQuantityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
