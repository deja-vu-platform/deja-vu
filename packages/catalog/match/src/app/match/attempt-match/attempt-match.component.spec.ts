import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttemptMatchComponent } from './attempt-match.component';

import { config } from '../testing/testbed.config';


describe('AttemptMatchComponent', () => {
  let component: AttemptMatchComponent;
  let fixture: ComponentFixture<AttemptMatchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttemptMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
