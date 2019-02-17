import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPublisherComponent } from './show-publisher.component';

import { config } from '../testing/testbed.config';


describe('ShowPublisherComponent', () => {
  let component: ShowPublisherComponent;
  let fixture: ComponentFixture<ShowPublisherComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPublisherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
