import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateRankingComponent } from './create-ranking.component';

describe('CreateRankingComponent', () => {
  let component: CreateRankingComponent;
  let fixture: ComponentFixture<CreateRankingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateRankingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateRankingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
