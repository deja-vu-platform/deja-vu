import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowRatingComponent } from './show-rating.component';

import { config } from '../testing/testbed.config';


describe('ShowRatingComponent', () => {
  let component: ShowRatingComponent;
  let fixture: ComponentFixture<ShowRatingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
