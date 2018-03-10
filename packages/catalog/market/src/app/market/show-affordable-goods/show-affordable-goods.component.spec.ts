import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAffordableGoodsComponent } from './show-affordable-goods.component';

describe('ShowAffordableGoodsComponent', () => {
  let component: ShowAffordableGoodsComponent;
  let fixture: ComponentFixture<ShowAffordableGoodsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowAffordableGoodsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowAffordableGoodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
