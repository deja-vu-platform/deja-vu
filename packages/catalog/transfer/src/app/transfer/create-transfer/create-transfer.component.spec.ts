import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTransferComponent } from './create-transfer.component';

import { config } from '../testing/testbed.config';


describe('CreateTransferComponent', () => {
  let component: CreateTransferComponent;
  let fixture: ComponentFixture<CreateTransferComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
