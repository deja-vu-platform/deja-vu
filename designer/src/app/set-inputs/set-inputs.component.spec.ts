import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MatCheckboxModule,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule
} from '@angular/material';

import {
  FloatingMenuComponent
} from '../floating-menu/floating-menu.component';
import { SetInputsComponent } from './set-inputs.component';

describe('SetInputsComponent', () => {
  let component: SetInputsComponent;
  let fixture: ComponentFixture<SetInputsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SetInputsComponent,
        FloatingMenuComponent
      ],
      imports: [
        FormsModule,
        MatCheckboxModule,
        MatDialogModule,
        MatMenuModule,
        MatIconModule,
        MatInputModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetInputsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
