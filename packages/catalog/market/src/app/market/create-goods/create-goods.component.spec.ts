import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGoodsComponent } from './create-goods.component';

describe('CreateGoodsComponent', () => {
  let component: CreateGoodsComponent;
  let fixture: ComponentFixture<CreateGoodsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateGoodsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateGoodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
