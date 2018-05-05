import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StageGoodsComponent } from './stage-goods.component';

describe('StageGoodsComponent', () => {
  let component: StageGoodsComponent;
  let fixture: ComponentFixture<StageGoodsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StageGoodsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StageGoodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
