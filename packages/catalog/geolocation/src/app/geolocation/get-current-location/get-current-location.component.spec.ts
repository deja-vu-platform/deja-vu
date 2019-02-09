import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GetCurrentLocationComponent } from './get-current-location.component';

import { config } from '../testbed.config';


describe('GetCurrentLocationComponent', () => {
  let component: GetCurrentLocationComponent;
  let fixture: ComponentFixture<GetCurrentLocationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GetCurrentLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
