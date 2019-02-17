import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePublisherComponent } from './create-publisher.component';

import { config } from '../testing/testbed.config';


describe('CreatePublisherComponent', () => {
  let component: CreatePublisherComponent;
  let fixture: ComponentFixture<CreatePublisherComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatePublisherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
