import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateScoreValueComponent } from './create-score-value.component';

describe('CreateScoreValueComponent', () => {
  let component: CreateScoreValueComponent;
  let fixture: ComponentFixture<CreateScoreValueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateScoreValueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateScoreValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
