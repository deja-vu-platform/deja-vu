import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMatchComponent } from './create-match.component';

import { config } from '../testing/testbed.config';


describe('CreateMatchComponent', () => {
  let component: CreateMatchComponent;
  let fixture: ComponentFixture<CreateMatchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
