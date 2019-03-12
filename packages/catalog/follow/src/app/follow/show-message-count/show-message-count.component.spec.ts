import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMessageCountComponent } from './show-message-count.component';

import { config } from '../testing/testbed.config';


describe('ShowMessageCountComponent', () => {
  let component: ShowMessageCountComponent;
  let fixture: ComponentFixture<ShowMessageCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMessageCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
