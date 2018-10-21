import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimSupplyComponent } from './claim-supply.component';

describe('ClaimSupplyComponent', () => {
  let component: ClaimSupplyComponent;
  let fixture: ComponentFixture<ClaimSupplyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClaimSupplyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClaimSupplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
