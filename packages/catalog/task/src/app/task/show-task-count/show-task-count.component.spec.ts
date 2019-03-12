import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTaskCountComponent } from './show-task-count.component';

import { config } from '../testing/testbed.config';


describe('ShowTaskCountComponent', () => {
  let component: ShowTaskCountComponent;
  let fixture: ComponentFixture<ShowTaskCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTaskCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
