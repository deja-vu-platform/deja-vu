import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowLabelCountComponent } from './show-label-count.component';

import { config } from '../testing/testbed.config';


describe('ShowLabelCountComponent', () => {
  let component: ShowLabelCountComponent;
  let fixture: ComponentFixture<ShowLabelCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowLabelCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
