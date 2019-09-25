import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyCanViewComponent } from './verify-can-view.component';

import { buildConfig } from '../testing/testbed.config';


describe('VerifyCanViewComponent', () => {
  let component: VerifyCanViewComponent;
  let fixture: ComponentFixture<VerifyCanViewComponent>;

  beforeEach(async(() => {
    const config = buildConfig({ data: { canView: true } }, null, {});
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VerifyCanViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
