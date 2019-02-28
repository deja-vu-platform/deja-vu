import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Edit<%= classify(clicheName) %>Component } from './edit-<%= dasherize(clicheName) %>.component';

import { config } from '../testing/testbed.config';


describe('Edit<%= classify(clicheName) %>Component', () => {
  let component: Edit<%= classify(clicheName) %>Component;
  let fixture: ComponentFixture<Edit<%= classify(clicheName) %>Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Edit<%= classify(clicheName) %>Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
