import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Edit<%= classify(conceptName) %>Component } from './edit-<%= dasherize(conceptName) %>.component';

import { config } from '../testing/testbed.config';


describe('Edit<%= classify(conceptName) %>Component', () => {
  let component: Edit<%= classify(conceptName) %>Component;
  let fixture: ComponentFixture<Edit<%= classify(conceptName) %>Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Edit<%= classify(conceptName) %>Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
