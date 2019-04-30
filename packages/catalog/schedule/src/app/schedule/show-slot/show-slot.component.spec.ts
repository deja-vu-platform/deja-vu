import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSlotComponent } from './show-slot.component';

import { config } from '../testing/testbed.config';


describe('ShowSlotComponent', () => {
  let component: ShowSlotComponent;
  let fixture: ComponentFixture<ShowSlotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowSlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
