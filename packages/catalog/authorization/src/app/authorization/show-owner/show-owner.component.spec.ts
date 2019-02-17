import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowOwnerComponent } from './show-owner.component';

import { config } from '../testing/testbed.config';


describe('ShowOwnerComponent', () => {
  let component: ShowOwnerComponent;
  let fixture: ComponentFixture<ShowOwnerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowOwnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
