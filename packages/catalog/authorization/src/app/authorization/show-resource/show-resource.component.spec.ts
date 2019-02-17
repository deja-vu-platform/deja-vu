import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowResourceComponent } from './show-resource.component';

import { config } from '../testing/testbed.config';


describe('ShowResourceComponent', () => {
  let component: ShowResourceComponent;
  let fixture: ComponentFixture<ShowResourceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
