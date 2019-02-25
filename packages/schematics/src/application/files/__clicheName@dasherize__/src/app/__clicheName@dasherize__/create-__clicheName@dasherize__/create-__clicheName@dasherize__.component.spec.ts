import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Create<%= classify(clicheName) %>Component } from './create-<%= dasherize(clicheName) %>.component';

import { config } from '../testing/testbed.config';


describe('Create<%= classify(clicheName) %>Component', () => {
  let component: Create<%= classify(clicheName) %>Component;
  let fixture: ComponentFixture<Create<%= classify(clicheName) %>Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Create<%= classify(clicheName) %>Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
