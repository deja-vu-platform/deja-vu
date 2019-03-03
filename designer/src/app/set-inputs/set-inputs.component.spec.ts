import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MatCheckboxModule,
  MatDialogModule,
  MatInputModule
} from '@angular/material';

import { SetInputsComponent } from './set-inputs.component';

describe('SetInputsComponent', () => {
  let component: SetInputsComponent;
  let fixture: ComponentFixture<SetInputsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetInputsComponent ],
      imports: [
        FormsModule,
        MatCheckboxModule,
        MatDialogModule,
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
