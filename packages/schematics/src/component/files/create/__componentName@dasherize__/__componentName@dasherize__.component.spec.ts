import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { <%= classify(componentName) %>Component } from './<%= dasherize(componentName) %>.component';

import { config } from '../testing/testbed.config';


describe('<%= classify(componentName) %>Component', () => {
  let component: <%= classify(componentName) %>Component;
  let fixture: ComponentFixture<<%= classify(componentName) %>Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(<%= classify(componentName) %>Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should ', () => {
    expect(component).toBeTruthy();
  });
});
