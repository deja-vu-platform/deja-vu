import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyGoodFractionComponent } from './buy-good-fraction.component';

describe('BuyGoodFractionComponent', () => {
  let component: BuyGoodFractionComponent;
  let fixture: ComponentFixture<BuyGoodFractionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuyGoodFractionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyGoodFractionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
