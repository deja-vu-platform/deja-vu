import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  SearchItemsByLabelsComponent
} from './search-items-by-labels.component';

describe('SearchItemsByLabelsComponent', () => {
  let component: SearchItemsByLabelsComponent;
  let fixture: ComponentFixture<SearchItemsByLabelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SearchItemsByLabelsComponent]
    })
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
