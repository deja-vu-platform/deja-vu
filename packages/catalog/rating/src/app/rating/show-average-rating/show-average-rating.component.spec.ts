import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAverageRatingComponent } from './show-average-rating.component';

describe('ShowAverageRatingComponent', () => {
  let component: ShowAverageRatingComponent;
  let fixture: ComponentFixture<ShowAverageRatingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowAverageRatingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowAverageRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
