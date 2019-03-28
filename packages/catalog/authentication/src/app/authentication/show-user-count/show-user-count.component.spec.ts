import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowUserCountComponent } from './show-user-count.component';

import { config } from '../testing/testbed.config';


describe('ShowUserCountComponent', () => {
  let component: ShowUserCountComponent;
  let fixture: ComponentFixture<ShowUserCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowUserCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
