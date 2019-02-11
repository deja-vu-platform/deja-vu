import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAllocationComponent } from './create-allocation.component';

import { config } from '../testing/testbed.config';


describe('CreateAllocationComponent', () => {
  let component: CreateAllocationComponent;
  let fixture: ComponentFixture<CreateAllocationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAllocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
