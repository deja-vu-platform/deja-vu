import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectAutocompleteComponent } from './object-autocomplete.component';

import { buildConfig } from '../testing/testbed.config';


describe('ObjectAutocompleteComponent', () => {
  let component: ObjectAutocompleteComponent;
  let fixture: ComponentFixture<ObjectAutocompleteComponent>;

  beforeEach(async(() => {
    const config = buildConfig({ data: { properties: null } }, null, {});
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
