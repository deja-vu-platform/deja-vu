import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseObjectComponent } from './choose-object.component';

import { config } from '../testing/testbed.config';


describe('ChooseObjectComponent', () => {
  let component: ChooseObjectComponent;
  let fixture: ComponentFixture<ChooseObjectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseObjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
