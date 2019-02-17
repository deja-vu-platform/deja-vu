import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CanViewComponent } from './can-view.component';

import { buildConfig } from '../testing/testbed.config';


describe('CanViewComponent', () => {
  let component: CanViewComponent;
  let fixture: ComponentFixture<CanViewComponent>;

  beforeEach(async(() => {
    const config = buildConfig({ data: { canView: true } }, null, {});
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CanViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
