import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowBalanceComponent } from './show-balance.component';

import { config } from '../testing/testbed.config';


describe('ShowBalanceComponent', () => {
  let component: ShowBalanceComponent;
  let fixture: ComponentFixture<ShowBalanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
