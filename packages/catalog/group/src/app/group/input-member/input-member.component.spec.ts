import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputMemberComponent } from './input-member.component';

import { config } from '../testing/testbed.config';


describe('InputMemberComponent', () => {
  let component: InputMemberComponent;
  let fixture: ComponentFixture<InputMemberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
