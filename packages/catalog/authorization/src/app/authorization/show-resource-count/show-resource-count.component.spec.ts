import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowResourceCountComponent } from './show-resource-count.component';

import { config } from '../testing/testbed.config';


describe('ShowResourceCountComponent', () => {
  let component: ShowResourceCountComponent;
  let fixture: ComponentFixture<ShowResourceCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowResourceCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
