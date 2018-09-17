import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGoodPriceComponent } from './create-good-price.component';

describe('CreateGoodPriceComponent', () => {
  let component: CreateGoodPriceComponent;
  let fixture: ComponentFixture<CreateGoodPriceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateGoodPriceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateGoodPriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
