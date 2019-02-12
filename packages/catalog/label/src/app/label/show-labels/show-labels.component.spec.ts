import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowLabelsComponent } from './show-labels.component';

import { config } from '../testing/testbed.config';


describe('ShowLabelsComponent', () => {
  let component: ShowLabelsComponent;
  let fixture: ComponentFixture<ShowLabelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowLabelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
