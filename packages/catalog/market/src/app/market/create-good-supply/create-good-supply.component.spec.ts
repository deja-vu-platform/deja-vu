import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGoodSupplyComponent } from './create-good-supply.component';

describe('CreateGoodSupplyComponent', () => {
  let component: CreateGoodSupplyComponent;
  let fixture: ComponentFixture<CreateGoodSupplyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateGoodSupplyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateGoodSupplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
