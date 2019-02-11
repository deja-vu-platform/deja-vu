import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateObjectsComponent } from './create-objects.component';

import { buildConfig } from '../testing/testbed.config';


describe('CreateObjectsComponent', () => {
  let component: CreateObjectsComponent;
  let fixture: ComponentFixture<CreateObjectsComponent>;

  beforeEach(async(() => {
    const config = buildConfig({ data: { properties: [] } }, null, {});
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateObjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
