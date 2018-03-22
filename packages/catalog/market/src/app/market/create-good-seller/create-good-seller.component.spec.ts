import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGoodSellerComponent } from './create-good-seller.component';

describe('CreateGoodSellerComponent', () => {
  let component: CreateGoodSellerComponent;
  let fixture: ComponentFixture<CreateGoodSellerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateGoodSellerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateGoodSellerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
