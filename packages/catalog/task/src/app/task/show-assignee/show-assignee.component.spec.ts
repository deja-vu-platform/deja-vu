import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAssigneeComponent } from './show-assignee.component';

import { config } from '../testing/testbed.config';


describe('ShowAssigneeComponent', () => {
  let component: ShowAssigneeComponent;
  let fixture: ComponentFixture<ShowAssigneeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowAssigneeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
