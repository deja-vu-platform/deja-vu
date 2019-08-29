import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Create<%= classify(conceptName) %>Component } from './create-<%= dasherize(conceptName) %>.component';

import { config } from '../testing/testbed.config';


describe('Create<%= classify(conceptName) %>Component', () => {
  let component: Create<%= classify(conceptName) %>Component;
  let fixture: ComponentFixture<Create<%= classify(conceptName) %>Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Create<%= classify(conceptName) %>Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
