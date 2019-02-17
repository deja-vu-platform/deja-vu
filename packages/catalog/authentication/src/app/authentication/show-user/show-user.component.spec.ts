import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowUserComponent } from './show-user.component';

import { config } from '../testing/testbed.config';


describe('ShowUserComponent', () => {
  let component: ShowUserComponent;
  let fixture: ComponentFixture<ShowUserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
