import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteGroupComponent } from './delete-group.component';

import { config } from '../testing/testbed.config';


describe('DeleteGroupComponent', () => {
  let component: DeleteGroupComponent;
  let fixture: ComponentFixture<DeleteGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
