import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowItemsComponent } from './show-items.component';

import { config } from '../testing/testbed.config';


describe('ShowItemsComponent', () => {
  let component: ShowItemsComponent;
  let fixture: ComponentFixture<ShowItemsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
