import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputItemCountsComponent } from './input-item-counts.component';

import { config } from '../testing/testbed.config';


describe('InputItemCountsComponent', () => {
  let component: InputItemCountsComponent;
  let fixture: ComponentFixture<InputItemCountsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputItemCountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
