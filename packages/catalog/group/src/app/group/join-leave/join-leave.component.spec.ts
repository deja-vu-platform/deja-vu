import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinLeaveComponent } from './join-leave.component';

import { buildConfig } from '../testing/testbed.config';


describe('JoinLeaveComponent', () => {
  let component: JoinLeaveComponent;
  let fixture: ComponentFixture<JoinLeaveComponent>;

  beforeEach(async(() => {
    const config = buildConfig({ data: { group: null } }, null, {});
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinLeaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
