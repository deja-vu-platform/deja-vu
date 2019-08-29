import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Delete<%= classify(conceptName) %>Component } from './delete-<%= dasherize(conceptName) %>.component';

import { config } from '../testing/testbed.config';


describe('Delete<%= classify(conceptName) %>Component', () => {
  let component: Delete<%= classify(conceptName) %>Component;
  let fixture: ComponentFixture<Delete<%= classify(conceptName) %>Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Delete<%= classify(conceptName) %>Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
