import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputMoneyComponent } from './input-money.component';

import { config } from '../testing/testbed.config';


describe('InputMoneyComponent', () => {
  let component: InputMoneyComponent;
  let fixture: ComponentFixture<InputMoneyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputMoneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
