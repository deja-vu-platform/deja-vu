import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowConsumerComponent } from './show-consumer.component';

import { config } from '../testing/testbed.config';


describe('ShowConsumerComponent', () => {
  let component: ShowConsumerComponent;
  let fixture: ComponentFixture<ShowConsumerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowConsumerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
