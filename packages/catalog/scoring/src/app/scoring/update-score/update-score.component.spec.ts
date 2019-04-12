import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateScoreComponent } from './update-score.component';

import { config } from '../testing/testbed.config';


describe('UpdateScoreComponent', () => {
  let component: UpdateScoreComponent;
  let fixture: ComponentFixture<UpdateScoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
