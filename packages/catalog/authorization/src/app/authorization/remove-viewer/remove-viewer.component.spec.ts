import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveViewerComponent } from './remove-viewer.component';

import { config } from '../testing/testbed.config';


describe('RemoveViewerComponent', () => {
  let component: RemoveViewerComponent;
  let fixture: ComponentFixture<RemoveViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
