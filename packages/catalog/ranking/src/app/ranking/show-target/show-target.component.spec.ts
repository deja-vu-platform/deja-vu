import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTargetComponent } from './show-target.component';

import { config } from '../testing/testbed.config';


describe('ShowTargetComponent', () => {
  let component: ShowTargetComponent;
  let fixture: ComponentFixture<ShowTargetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
