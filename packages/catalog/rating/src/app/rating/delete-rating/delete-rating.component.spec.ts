import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteRatingComponent } from './delete-rating.component';

import { config } from '../testing/testbed.config';


describe('DeleteRatingComponent', () => {
  let component: DeleteRatingComponent;
  let fixture: ComponentFixture<DeleteRatingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
