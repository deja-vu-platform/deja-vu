import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMessagesComponent } from './show-messages.component';

import { config } from '../testing/testbed.config';


describe('ShowMessagesComponent', () => {
  let component: ShowMessagesComponent;
  let fixture: ComponentFixture<ShowMessagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
