import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowRatingCountComponent } from './show-rating-count.component';

import { config } from '../testing/testbed.config';


describe('ShowRatingCountComponent', () => {
  let component: ShowRatingCountComponent;
  let fixture: ComponentFixture<ShowRatingCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowRatingCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
