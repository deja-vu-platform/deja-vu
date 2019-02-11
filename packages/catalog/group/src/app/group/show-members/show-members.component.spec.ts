import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMembersComponent } from './show-members.component';

import { config } from '../testing/testbed.config';


describe('ShowMembersComponent', () => {
  let component: ShowMembersComponent;
  let fixture: ComponentFixture<ShowMembersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
