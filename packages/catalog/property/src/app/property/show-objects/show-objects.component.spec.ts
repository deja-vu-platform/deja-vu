import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowObjectsComponent } from './show-objects.component';

import { config } from '../testing/testbed.config';


describe('ShowObjectsComponent', () => {
  let component: ShowObjectsComponent;
  let fixture: ComponentFixture<ShowObjectsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowObjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
