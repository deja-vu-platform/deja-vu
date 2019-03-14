import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatCheckboxModule,
  MatDialogModule,
  MatDialogRef,
  MatSelectModule
} from '@angular/material';

import { InputActionComponent } from './input-action.component';

import { SetInputsComponent } from '../set-inputs/set-inputs.component';

describe('InputActionComponent', () => {
  let component: InputActionComponent;
  let fixture: ComponentFixture<InputActionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        InputActionComponent,
        SetInputsComponent
      ],
      imports: [
        FormsModule,
        MatCheckboxModule,
        MatDialogModule,
        MatSelectModule
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
