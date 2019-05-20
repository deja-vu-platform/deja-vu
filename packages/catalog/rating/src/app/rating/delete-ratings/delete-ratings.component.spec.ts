import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteRatingsComponent } from './delete-ratings.component';

import { config } from '../testing/testbed.config';


describe('DeleteRatingsComponent', () => {
  let component: DeleteRatingsComponent;
  let fixture: ComponentFixture<DeleteRatingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteRatingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
