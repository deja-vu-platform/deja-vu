import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowObjectComponent } from './show-object.component';

import { config } from '../testing/testbed.config';


describe('ShowObjectComponent', () => {
  let component: ShowObjectComponent;
  let fixture: ComponentFixture<ShowObjectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowObjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
