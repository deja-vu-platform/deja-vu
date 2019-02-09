import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMarkerComponent } from './show-marker.component';

import { config } from '../testbed.config';


describe('ShowMarkerComponent', () => {
  let component: ShowMarkerComponent;
  let fixture: ComponentFixture<ShowMarkerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMarkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
