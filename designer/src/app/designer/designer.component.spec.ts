import { async, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MatCheckboxModule,
  MatDialogModule,
  MatExpansionModule,
  MatIconModule,
  MatListModule,
  MatMenuModule,
  MatSelectModule,
  MatSnackBarModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule
} from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { ElectronService } from 'ngx-electron';

import { DvModule } from '@deja-vu/core';

import { DesignerComponent } from './designer.component';

import {
  ActionDefinitionComponent
} from '../action-definition/action-definition.component';
import {
  ActionInstanceComponent
} from '../action-instance/action-instance.component';
import {
  ClicheInstancesComponent
} from '../cliche-instances/cliche-instances.component';
import {
  FloatingMenuComponent
} from '../floating-menu/floating-menu.component';
import {
  InsertActionComponent
} from '../insert-action/insert-action.component';
import { SetInputsComponent } from '../set-inputs/set-inputs.component';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { TopBarComponent } from '../top-bar/top-bar.component';

describe('DesignerComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ActionDefinitionComponent,
        ActionInstanceComponent,
        ClicheInstancesComponent,
        DesignerComponent,
        FloatingMenuComponent,
        InsertActionComponent,
        SetInputsComponent,
        SideMenuComponent,
        TopBarComponent
      ],
      imports: [
        DvModule,
        FormsModule,
        MatCheckboxModule,
        MatDialogModule,
        MatExpansionModule,
        MatIconModule,
        MatListModule,
        MatMenuModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTabsModule,
        MatToolbarModule,
        MatTooltipModule,
        RouterTestingModule
      ],
      providers: [
        ElectronService
      ]
    })
    .compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(DesignerComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app)
      .toBeTruthy();
  }));
});
