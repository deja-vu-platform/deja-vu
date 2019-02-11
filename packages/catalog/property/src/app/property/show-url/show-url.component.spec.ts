import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowUrlComponent } from './show-url.component';

import { config } from '../testing/testbed.config';


describe('ShowUrlComponent', () => {
  let component: ShowUrlComponent;
  let fixture: ComponentFixture<ShowUrlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowUrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
