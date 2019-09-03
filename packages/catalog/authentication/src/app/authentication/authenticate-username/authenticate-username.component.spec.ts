import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthenticateUsernameComponent } from './authenticate-username.component';

import { config } from '../testing/testbed.config';


describe('AuthenticateUsernameComponent', () => {
  let component: AuthenticateUsernameComponent;
  let fixture: ComponentFixture<AuthenticateUsernameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthenticateUsernameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
