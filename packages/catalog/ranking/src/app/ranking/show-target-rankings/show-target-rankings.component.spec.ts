import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTargetRankingsComponent } from './show-target-rankings.component';

describe('ShowTargetRankingsComponent', () => {
  let component: ShowTargetRankingsComponent;
  let fixture: ComponentFixture<ShowTargetRankingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowTargetRankingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTargetRankingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
