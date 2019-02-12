import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTargetsByScoreComponent } from './show-targets-by-score.component';

import { config } from '../testing/testbed.config';


describe('ShowTargetsByScoreComponent', () => {
  let component: ShowTargetsByScoreComponent;
  let fixture: ComponentFixture<ShowTargetsByScoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTargetsByScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
