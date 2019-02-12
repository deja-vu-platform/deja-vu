import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowLabelComponent } from './show-label.component';

import { config } from '../testing/testbed.config';


describe('ShowLabelComponent', () => {
  let component: ShowLabelComponent;
  let fixture: ComponentFixture<ShowLabelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
