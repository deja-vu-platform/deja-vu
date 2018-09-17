import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowGoodsComponent } from './show-goods.component';

describe('ShowGoodsComponent', () => {
  let component: ShowGoodsComponent;
  let fixture: ComponentFixture<ShowGoodsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowGoodsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowGoodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
