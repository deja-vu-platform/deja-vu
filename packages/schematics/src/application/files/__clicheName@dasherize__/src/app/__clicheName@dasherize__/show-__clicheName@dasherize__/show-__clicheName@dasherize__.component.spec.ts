import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Show<%= classify(clicheName) %>Component } from './show-<%= dasherize(clicheName) %>.component';

import { config } from '../testing/testbed.config';


describe('Show<%= classify(clicheName) %>Component', () => {
  let component: Show<%= classify(clicheName) %>Component;
  let fixture: ComponentFixture<Show<%= classify(clicheName) %>Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Show<%= classify(clicheName) %>Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
