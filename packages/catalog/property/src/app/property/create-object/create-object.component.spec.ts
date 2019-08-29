import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateObjectComponent } from './create-object.component';

import { buildConfig, testConfig } from '../testing/testbed.config';


describe('CreateObjectComponent', () => {
  let component: CreateObjectComponent;
  let fixture: ComponentFixture<CreateObjectComponent>;

  beforeEach(async(() => {
    const config = buildConfig(
      { data: { properties: [] } }, null, testConfig);
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateObjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
