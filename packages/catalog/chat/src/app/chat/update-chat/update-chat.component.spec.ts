import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditChatComponent } from './edit-chat.component';

import { config } from '../testing/testbed.config';


describe('EditChatComponent', () => {
  let component: EditChatComponent;
  let fixture: ComponentFixture<EditChatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
