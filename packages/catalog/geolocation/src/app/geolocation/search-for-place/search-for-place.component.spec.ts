import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchForPlaceComponent } from './search-for-place.component';

describe('SearchForPlaceComponent', () => {
  let component: SearchForPlaceComponent;
  let fixture: ComponentFixture<SearchForPlaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchForPlaceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchForPlaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
