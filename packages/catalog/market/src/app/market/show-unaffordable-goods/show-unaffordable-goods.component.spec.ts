import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowUnaffordableGoodsComponent } from './show-unaffordable-goods.component';

describe('ShowUnaffordableGoodsComponent', () => {
  let component: ShowUnaffordableGoodsComponent;
  let fixture: ComponentFixture<ShowUnaffordableGoodsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowUnaffordableGoodsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowUnaffordableGoodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
