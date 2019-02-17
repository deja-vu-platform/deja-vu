import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTransfersComponent } from './show-transfers.component';

import { config } from '../testing/testbed.config';


describe('ShowTransfersComponent', () => {
  let component: ShowTransfersComponent;
  let fixture: ComponentFixture<ShowTransfersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTransfersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
