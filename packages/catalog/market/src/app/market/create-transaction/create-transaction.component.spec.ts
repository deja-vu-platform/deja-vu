import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyGoodButtonComponent } from './buy-good-button.component';

describe('BuyGoodButtonComponent', () => {
  let component: BuyGoodButtonComponent;
  let fixture: ComponentFixture<BuyGoodButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuyGoodButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyGoodButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
