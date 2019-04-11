import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteChatComponent } from './delete-chat.component';

import { config } from '../testing/testbed.config';


describe('DeleteChatComponent', () => {
  let component: DeleteChatComponent;
  let fixture: ComponentFixture<DeleteChatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
