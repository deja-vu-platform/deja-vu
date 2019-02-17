import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRemoveViewerComponent } from './add-remove-viewer.component';

import { buildConfig } from '../testing/testbed.config';


describe('AddRemoveViewerComponent', () => {
  let component: AddRemoveViewerComponent;
  let fixture: ComponentFixture<AddRemoveViewerComponent>;

  beforeEach(async(() => {
    const config = buildConfig({ data: { canView: true } }, null, {});
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRemoveViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
