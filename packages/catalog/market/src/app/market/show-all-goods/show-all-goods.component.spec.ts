import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAllGoodsComponent } from './show-all-goods.component';

describe('ShowAllGoodsComponent', () => {
  let component: ShowAllGoodsComponent;
  let fixture: ComponentFixture<ShowAllGoodsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowAllGoodsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowAllGoodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
