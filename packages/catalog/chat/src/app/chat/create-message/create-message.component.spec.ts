import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMessageComponent } from './create-message.component';

import { config } from '../testing/testbed.config';


describe('CreateMessageComponent', () => {
  let component: CreateMessageComponent;
  let fixture: ComponentFixture<CreateMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
