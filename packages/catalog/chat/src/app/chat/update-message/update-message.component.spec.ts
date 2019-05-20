import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateMessageComponent } from './update-message.component';

import { config } from '../testing/testbed.config';


describe('UpdateMessageComponent', () => {
  let component: UpdateMessageComponent;
  let fixture: ComponentFixture<UpdateMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
