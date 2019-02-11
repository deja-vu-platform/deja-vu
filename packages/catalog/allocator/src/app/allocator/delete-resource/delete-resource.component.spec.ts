import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteResourceComponent } from './delete-resource.component';

import { config } from '../testing/testbed.config';


describe('DeleteResourceComponent', () => {
  let component: DeleteResourceComponent;
  let fixture: ComponentFixture<DeleteResourceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
