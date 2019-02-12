import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttachLabelsComponent } from './attach-labels.component';

import { config } from '../testing/testbed.config';


describe('AttachLabelsComponent', () => {
  let component: AttachLabelsComponent;
  let fixture: ComponentFixture<AttachLabelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttachLabelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
