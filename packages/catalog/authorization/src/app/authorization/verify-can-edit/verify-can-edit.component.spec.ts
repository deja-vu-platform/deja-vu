import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyCanEditComponent } from './verify-can-edit.component';

import { config } from '../testing/testbed.config';


describe('VerifyCanEditComponent', () => {
  let component: VerifyCanEditComponent;
  let fixture: ComponentFixture<VerifyCanEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VerifyCanEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
