import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowScoreComponent } from './show-score.component';

describe('ShowScoreComponent', () => {
  let component: ShowScoreComponent;
  let fixture: ComponentFixture<ShowScoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowScoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
