import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteEventComponent } from './delete-event.component';

import { config } from '../testing/testbed.config';


describe('DeleteEventComponent', () => {
  let component: DeleteEventComponent;
  let fixture: ComponentFixture<DeleteEventComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
