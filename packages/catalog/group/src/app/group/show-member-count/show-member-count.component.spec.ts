import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMemberCountComponent } from './show-member-count.component';

import { config } from '../testing/testbed.config';


describe('ShowMemberCountComponent', () => {
  let component: ShowMemberCountComponent;
  let fixture: ComponentFixture<ShowMemberCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMemberCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
