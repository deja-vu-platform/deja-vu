import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatSelectModule
} from '@angular/material';

import { ActionDefinitionComponent } from './action-definition.component';

import {
  ActionInstanceComponent
} from '../action-instance/action-instance.component';
import { SetInputsComponent } from '../set-inputs/set-inputs.component';

describe('ActionDefinitionComponent', () => {
  let component: ActionDefinitionComponent;
  let fixture: ComponentFixture<ActionDefinitionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ActionDefinitionComponent,
        ActionInstanceComponent,
        SetInputsComponent
      ],
      imports: [
        FormsModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatSelectModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
