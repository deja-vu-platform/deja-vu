import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPublisherCountComponent } from './show-publisher-count.component';

import { config } from '../testing/testbed.config';


describe('ShowPublisherCountComponent', () => {
  let component: ShowPublisherCountComponent;
  let fixture: ComponentFixture<ShowPublisherCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPublisherCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
