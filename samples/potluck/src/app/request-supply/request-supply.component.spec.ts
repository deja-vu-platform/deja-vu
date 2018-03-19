import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestSupplyComponent } from './request-supply.component';

describe('RequestSupplyComponent', () => {
  let component: RequestSupplyComponent;
  let fixture: ComponentFixture<RequestSupplyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestSupplyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestSupplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
