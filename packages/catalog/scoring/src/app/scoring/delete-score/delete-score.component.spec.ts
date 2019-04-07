import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteScoreComponent } from './delete-score.component';

import { config } from '../testing/testbed.config';


describe('DeleteScoreComponent', () => {
  let component: DeleteScoreComponent;
  let fixture: ComponentFixture<DeleteScoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
