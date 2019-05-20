import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowChatComponent } from './show-chat.component';

import { config } from '../testing/testbed.config';


describe('ShowChatComponent', () => {
  let component: ShowChatComponent;
  let fixture: ComponentFixture<ShowChatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
