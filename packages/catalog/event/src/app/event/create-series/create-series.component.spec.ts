import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSeriesComponent } from './create-series.component';

import { config } from '../testing/testbed.config';


describe('CreateSeriesComponent', () => {
  let component: CreateSeriesComponent;
  let fixture: ComponentFixture<CreateSeriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSeriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
