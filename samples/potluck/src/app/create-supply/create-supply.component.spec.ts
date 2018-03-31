import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSupplyComponent } from './create-supply.component';

describe('CreateSupplyComponent', () => {
  let component: CreateSupplyComponent;
  let fixture: ComponentFixture<CreateSupplyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateSupplyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSupplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
