import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ChooseAndShowSeriesComponent
} from './choose-and-show-series.component';

import { config } from '../testing/testbed.config';


describe('ChooseAndShowSeriesComponent', () => {
  let component: ChooseAndShowSeriesComponent;
  let fixture: ComponentFixture<ChooseAndShowSeriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseAndShowSeriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
