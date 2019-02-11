import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowResourcesComponent } from './show-resources.component';

import { config } from '../testing/testbed.config';


describe('ShowResourcesComponent', () => {
  let component: ShowResourcesComponent;
  let fixture: ComponentFixture<ShowResourcesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowResourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
