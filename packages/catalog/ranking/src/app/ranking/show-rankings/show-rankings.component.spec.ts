import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowRankingsComponent } from './show-rankings.component';

import { config } from '../testing/testbed.config';


describe('ShowRankingsComponent', () => {
  let component: ShowRankingsComponent;
  let fixture: ComponentFixture<ShowRankingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowRankingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
