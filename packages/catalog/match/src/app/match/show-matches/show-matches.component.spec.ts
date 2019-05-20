import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMatchesComponent } from './show-matches.component';

import { config } from '../testing/testbed.config';


describe('ShowMatchesComponent', () => {
  let component: ShowMatchesComponent;
  let fixture: ComponentFixture<ShowMatchesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
