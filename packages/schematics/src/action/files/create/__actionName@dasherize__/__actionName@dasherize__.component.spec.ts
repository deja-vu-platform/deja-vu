import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { <%= classify(actionName) %>Component } from './<%= dasherize(actionName) %>.component';

import { config } from '../testing/testbed.config';


describe('<%= classify(actionName) %>Component', () => {
  let component: <%= classify(actionName) %>Component;
  let fixture: ComponentFixture<<%= classify(actionName) %>Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(<%= classify(actionName) %>Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should ', () => {
    expect(component).toBeTruthy();
  });
});
