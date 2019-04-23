import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAllAvailabilityComponent } from './show-all-availability.component';

import { config } from '../testing/testbed.config';


describe('ShowAllAvailabilityComponent', () => {
  let component: ShowAllAvailabilityComponent;
  let fixture: ComponentFixture<ShowAllAvailabilityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowAllAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
