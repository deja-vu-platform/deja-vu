import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAttemptsComponent } from './show-attempts.component';

import { config } from '../testing/testbed.config';


describe('ShowAttemptsComponent', () => {
  let component: ShowAttemptsComponent;
  let fixture: ComponentFixture<ShowAttemptsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowAttemptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
