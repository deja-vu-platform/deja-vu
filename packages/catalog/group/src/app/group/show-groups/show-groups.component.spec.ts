import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowGroupsComponent } from './show-groups.component';

import { config } from '../testing/testbed.config';


describe('ShowGroupsComponent', () => {
  let component: ShowGroupsComponent;
  let fixture: ComponentFixture<ShowGroupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
