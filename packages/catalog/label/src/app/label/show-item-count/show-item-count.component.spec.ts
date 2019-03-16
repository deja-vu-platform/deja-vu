import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowItemCountComponent } from './show-item-count.component';

import { config } from '../testing/testbed.config';


describe('ShowItemCountComponent', () => {
  let component: ShowItemCountComponent;
  let fixture: ComponentFixture<ShowItemCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowItemCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
