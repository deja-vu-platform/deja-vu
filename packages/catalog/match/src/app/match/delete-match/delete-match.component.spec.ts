import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteMatchComponent } from './delete-match.component';

import { config } from '../testing/testbed.config';


describe('DeleteMatchComponent', () => {
  let component: DeleteMatchComponent;
  let fixture: ComponentFixture<DeleteMatchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
