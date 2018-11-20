import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTargetsByScoreComponent } from './show-targets-by-score.component';

describe('ShowTargetsByScoreComponent', () => {
  let component: ShowTargetsByScoreComponent;
  let fixture: ComponentFixture<ShowTargetsByScoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowTargetsByScoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTargetsByScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
