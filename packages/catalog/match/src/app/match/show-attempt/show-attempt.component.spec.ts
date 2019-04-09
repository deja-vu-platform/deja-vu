import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAttemptComponent } from './show-attempt.component';

import { config } from '../testing/testbed.config';


describe('ShowAttemptComponent', () => {
  let component: ShowAttemptComponent;
  let fixture: ComponentFixture<ShowAttemptComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowAttemptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
