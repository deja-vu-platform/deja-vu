import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MatCheckboxModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatSelectModule,
  MatTabsModule,
  MatTooltipModule
} from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { RunService } from '@deja-vu/core';

import { ComponentDefinitionComponent } from './component-definition.component';

import {
  ComponentInstanceComponent
} from '../component-instance/component-instance.component';
import {
  FloatingMenuComponent
} from '../floating-menu/floating-menu.component';
import { SetInputsComponent } from '../set-inputs/set-inputs.component';

describe('ComponentDefinitionComponent', () => {
  let component: ComponentDefinitionComponent;
  let fixture: ComponentFixture<ComponentDefinitionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ComponentDefinitionComponent,
        ComponentInstanceComponent,
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
        MatTabsModule,
        MatTooltipModule,
        RouterTestingModule
      ],
      providers: [
        { provide: RunService, useValue: { registerAppComponent: () => {} } }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComponentDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
