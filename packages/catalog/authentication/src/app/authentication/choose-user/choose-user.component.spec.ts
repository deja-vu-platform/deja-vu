import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseUserComponent } from './choose-user.component';

import { config } from '../testing/testbed.config';


describe('ChooseUserComponent', () => {
  let component: ChooseUserComponent;
  let fixture: ComponentFixture<ChooseUserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
