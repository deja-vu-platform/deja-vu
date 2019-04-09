import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WithdrawAttemptComponent } from './withdraw-attempt.component';

import { config } from '../testing/testbed.config';


describe('WithdrawAttemptComponent', () => {
  let component: WithdrawAttemptComponent;
  let fixture: ComponentFixture<WithdrawAttemptComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawAttemptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
