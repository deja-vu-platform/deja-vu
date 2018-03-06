import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowRatingsByTargetComponent } from './show-ratings-by-target.component';

describe('ShowRatingsByTargetComponent', () => {
  let component: ShowRatingsByTargetComponent;
  let fixture: ComponentFixture<ShowRatingsByTargetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowRatingsByTargetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowRatingsByTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
