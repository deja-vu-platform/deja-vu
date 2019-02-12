import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ShowFractionalRankingComponent
} from './show-fractional-ranking.component';

import { config } from '../testing/testbed.config';


describe('ShowFractionalRankingComponent', () => {
  let component: ShowFractionalRankingComponent;
  let fixture: ComponentFixture<ShowFractionalRankingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowFractionalRankingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
