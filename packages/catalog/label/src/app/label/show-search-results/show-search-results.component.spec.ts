import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSearchResultsComponent } from './show-search-results.component';

describe('ShowSearchResultsComponent', () => {
  let component: ShowSearchResultsComponent;
  let fixture: ComponentFixture<ShowSearchResultsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowSearchResultsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowSearchResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
