import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimTaskComponent } from './claim-task.component';

import { config } from '../testing/testbed.config';


describe('ClaimTaskComponent', () => {
  let component: ClaimTaskComponent;
  let fixture: ComponentFixture<ClaimTaskComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClaimTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
