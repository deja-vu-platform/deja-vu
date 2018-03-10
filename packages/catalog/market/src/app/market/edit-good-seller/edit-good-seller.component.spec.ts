import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditGoodSellerComponent } from './edit-good-seller.component';

describe('EditGoodSellerComponent', () => {
  let component: EditGoodSellerComponent;
  let fixture: ComponentFixture<EditGoodSellerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditGoodSellerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditGoodSellerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
