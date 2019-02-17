import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTransferComponent } from './show-transfer.component';

import { config } from '../testing/testbed.config';


describe('ShowTransferComponent', () => {
  let component: ShowTransferComponent;
  let fixture: ComponentFixture<ShowTransferComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
