import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWeeklySeriesComponent } from './create-weekly-series.component';

import { config } from '../testing/testbed.config';


describe('CreateWeeklySeriesComponent', () => {
  let component: CreateWeeklySeriesComponent;
  let fixture: ComponentFixture<CreateWeeklySeriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateWeeklySeriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
