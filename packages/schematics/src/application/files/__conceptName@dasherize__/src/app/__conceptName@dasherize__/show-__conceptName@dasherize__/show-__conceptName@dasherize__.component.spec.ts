import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Show<%= classify(conceptName) %>Component } from './show-<%= dasherize(conceptName) %>.component';

import { config } from '../testing/testbed.config';


describe('Show<%= classify(conceptName) %>Component', () => {
  let component: Show<%= classify(conceptName) %>Component;
  let fixture: ComponentFixture<Show<%= classify(conceptName) %>Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Show<%= classify(conceptName) %>Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
