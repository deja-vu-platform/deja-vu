import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowFractionRankingComponent } from './show-fractional-ranking.component';

describe('ShowFractionRankingComponent', () => {
  let component: ShowFractionRankingComponent;
  let fixture: ComponentFixture<ShowFractionRankingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowFractionRankingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowFractionRankingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
