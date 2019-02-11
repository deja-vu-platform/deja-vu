import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAverageRatingComponent } from './show-average-rating.component';

import { config } from '../testing/testbed.config';


describe('ShowAverageRatingComponent', () => {
  let component: ShowAverageRatingComponent;
  let fixture: ComponentFixture<ShowAverageRatingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowAverageRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
