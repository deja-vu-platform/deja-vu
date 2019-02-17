import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CanEditComponent } from './can-edit.component';

import { buildConfig } from '../testing/testbed.config';


describe('CanEditComponent', () => {
  let component: CanEditComponent;
  let fixture: ComponentFixture<CanEditComponent>;

  beforeEach(async(() => {
    const config = buildConfig({ data: { canEdit: true } }, null, {});
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CanEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
