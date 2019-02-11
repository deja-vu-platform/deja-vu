import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  SearchItemsByLabelsComponent
} from './search-items-by-labels.component';

import { config } from '../testing/testbed.config';


describe('SearchItemsByLabelsComponent', () => {
  let component: SearchItemsByLabelsComponent;
  let fixture: ComponentFixture<SearchItemsByLabelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchItemsByLabelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
