import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDueDateComponent } from './create-due-date.component';

import { config } from '../testing/testbed.config';


describe('CreateDueDateComponent', () => {
  let component: CreateDueDateComponent;
  let fixture: ComponentFixture<CreateDueDateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateDueDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
