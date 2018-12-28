import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchForLocationComponent } from './search-for-location.component';

describe('SearchForLocationComponent', () => {
  let component: SearchForLocationComponent;
  let fixture: ComponentFixture<SearchForLocationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SearchForLocationComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchForLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
