import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowItemComponent } from './show-item.component';

import { config } from '../testing/testbed.config';


describe('ShowItemComponent', () => {
  let component: ShowItemComponent;
  let fixture: ComponentFixture<ShowItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
