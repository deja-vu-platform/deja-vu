import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowGroupCountComponent } from './show-group-count.component';

import { config } from '../testing/testbed.config';


describe('ShowGroupCountComponent', () => {
  let component: ShowGroupCountComponent;
  let fixture: ComponentFixture<ShowGroupCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowGroupCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
