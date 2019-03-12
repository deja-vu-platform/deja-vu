import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTargetCountComponent } from './show-target-count.component';

import { config } from '../testing/testbed.config';


describe('ShowTargetCountComponent', () => {
  let component: ShowTargetCountComponent;
  let fixture: ComponentFixture<ShowTargetCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTargetCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
