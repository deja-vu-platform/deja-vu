import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTaskComponent } from './show-task.component';

import { config } from '../testing/testbed.config';


describe('ShowTaskComponent', () => {
  let component: ShowTaskComponent;
  let fixture: ComponentFixture<ShowTaskComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
