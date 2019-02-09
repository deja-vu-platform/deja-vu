import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMarkerComponent } from './create-marker.component';

import { config } from '../testbed.config';


describe('CreateMarkerComponent', () => {
  let component: CreateMarkerComponent;
  let fixture: ComponentFixture<CreateMarkerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateMarkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
