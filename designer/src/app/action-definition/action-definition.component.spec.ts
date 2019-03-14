import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MatCheckboxModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatSelectModule,
  MatTabsModule
} from '@angular/material';
import { RunService } from '@deja-vu/core';

import { ActionDefinitionComponent } from './action-definition.component';

import {
  ActionInstanceComponent
} from '../action-instance/action-instance.component';
import {
  FloatingMenuComponent
} from '../floating-menu/floating-menu.component';
import { SetInputsComponent } from '../set-inputs/set-inputs.component';

describe('ActionDefinitionComponent', () => {
  let component: ActionDefinitionComponent;
  let fixture: ComponentFixture<ActionDefinitionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ActionDefinitionComponent,
        ActionInstanceComponent,
        FloatingMenuComponent,
        SetInputsComponent
      ],
      imports: [
        FormsModule,
        MatCheckboxModule,
        MatMenuModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatTabsModule
      ],
      providers: [
        { provide: RunService, useValue: {} }
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
