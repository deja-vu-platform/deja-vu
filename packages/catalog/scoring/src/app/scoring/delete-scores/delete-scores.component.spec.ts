import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteScoresComponent } from './delete-scores.component';

import { config } from '../testing/testbed.config';


describe('DeleteScoresComponent', () => {
  let component: DeleteScoresComponent;
  let fixture: ComponentFixture<DeleteScoresComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteScoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
