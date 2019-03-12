import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowEventCountComponent } from './show-event-count.component';

import { config } from '../testing/testbed.config';


describe('ShowEventCountComponent', () => {
  let component: ShowEventCountComponent;
  let fixture: ComponentFixture<ShowEventCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowEventCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
