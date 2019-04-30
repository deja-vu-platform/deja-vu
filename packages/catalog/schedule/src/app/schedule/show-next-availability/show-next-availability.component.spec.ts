import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ShowNextAvailabilityComponent
} from './show-next-availability.component';

import { config } from '../testing/testbed.config';


describe('ShowNextAvailabilityComponent', () => {
  let component: ShowNextAvailabilityComponent;
  let fixture: ComponentFixture<ShowNextAvailabilityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowNextAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
