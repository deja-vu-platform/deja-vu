import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSlotsComponent } from './show-slots.component';

import { config } from '../testing/testbed.config';


describe('ShowSlotsComponent', () => {
  let component: ShowSlotsComponent;
  let fixture: ComponentFixture<ShowSlotsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowSlotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
