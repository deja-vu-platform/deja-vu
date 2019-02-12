import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowGroupComponent } from './show-group.component';

import { config } from '../testing/testbed.config';


describe('ShowGroupComponent', () => {
  let component: ShowGroupComponent;
  let fixture: ComponentFixture<ShowGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
