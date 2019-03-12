import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMarkerCountComponent } from './show-marker-count.component';

import { config } from '../testing/testbed.config';


describe('ShowMarkerCountComponent', () => {
  let component: ShowMarkerCountComponent;
  let fixture: ComponentFixture<ShowMarkerCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMarkerCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
