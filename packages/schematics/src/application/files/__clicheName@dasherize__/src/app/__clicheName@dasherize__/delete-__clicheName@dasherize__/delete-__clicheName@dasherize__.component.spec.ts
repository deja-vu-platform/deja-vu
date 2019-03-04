import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Delete<%= classify(clicheName) %>Component } from './delete-<%= dasherize(clicheName) %>.component';

import { config } from '../testing/testbed.config';


describe('Delete<%= classify(clicheName) %>Component', () => {
  let component: Delete<%= classify(clicheName) %>Component;
  let fixture: ComponentFixture<Delete<%= classify(clicheName) %>Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Delete<%= classify(clicheName) %>Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
