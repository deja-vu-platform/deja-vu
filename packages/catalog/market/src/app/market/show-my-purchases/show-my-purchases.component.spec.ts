import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMyPurchasesComponent } from './show-my-purchases.component';

describe('ShowMyPurchasesComponent', () => {
  let component: ShowMyPurchasesComponent;
  let fixture: ComponentFixture<ShowMyPurchasesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowMyPurchasesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMyPurchasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
