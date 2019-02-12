import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMessageComponent } from './edit-message.component';

import { config } from '../testing/testbed.config';


describe('EditMessageComponent', () => {
  let component: EditMessageComponent;
  let fixture: ComponentFixture<EditMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
