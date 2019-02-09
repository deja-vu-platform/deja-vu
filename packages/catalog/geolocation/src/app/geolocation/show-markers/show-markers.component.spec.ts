import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMarkersComponent } from './show-markers.component';

import { config } from '../testbed.config';


describe('ShowMarkersComponent', () => {
  let component: ShowMarkersComponent;
  let fixture: ComponentFixture<ShowMarkersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMarkersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
