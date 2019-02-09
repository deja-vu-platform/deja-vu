import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteMarkerComponent } from './delete-marker.component';

import { config } from '../testbed.config';


describe('DeleteMarkerComponent', () => {
  let component: DeleteMarkerComponent;
  let fixture: ComponentFixture<DeleteMarkerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteMarkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
