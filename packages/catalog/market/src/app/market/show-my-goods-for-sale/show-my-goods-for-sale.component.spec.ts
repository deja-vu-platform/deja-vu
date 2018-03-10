import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMyGoodsForSaleComponent } from './show-my-goods-for-sale.component';

describe('ShowMyGoodsForSaleComponent', () => {
  let component: ShowMyGoodsForSaleComponent;
  let fixture: ComponentFixture<ShowMyGoodsForSaleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowMyGoodsForSaleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMyGoodsForSaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
