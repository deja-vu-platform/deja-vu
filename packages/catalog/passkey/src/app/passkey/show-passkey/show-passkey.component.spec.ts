import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPasskeyComponent } from './show-passkey.component';

import { config } from '../testing/testbed.config';


describe('ShowPasskeyComponent', () => {
  let component: ShowPasskeyComponent;
  let fixture: ComponentFixture<ShowPasskeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPasskeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
