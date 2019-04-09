import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMatchComponent } from './edit-match.component';

import { config } from '../testing/testbed.config';


describe('EditMatchComponent', () => {
  let component: EditMatchComponent;
  let fixture: ComponentFixture<EditMatchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
