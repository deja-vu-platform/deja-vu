import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyObjectMatchesComponent } from './verify-object-matches.component';

import { config } from '../testing/testbed.config';


describe('VerifyObjectMatchesComponent', () => {
  let component: VerifyObjectMatchesComponent;
  let fixture: ComponentFixture<VerifyObjectMatchesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VerifyObjectMatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
