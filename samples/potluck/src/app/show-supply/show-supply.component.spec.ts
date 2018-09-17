import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSupplyComponent } from './show-supply.component';

describe('ShowSupplyComponent', () => {
  let component: ShowSupplyComponent;
  let fixture: ComponentFixture<ShowSupplyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowSupplyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowSupplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
