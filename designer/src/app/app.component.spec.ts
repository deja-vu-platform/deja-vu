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
  MatToolbarModule
} from '@angular/material';
import { ElectronService } from 'ngx-electron';

import { DvModule } from '@deja-vu/core';

import { AppComponent } from './app.component';

import {
  ActionDefinitionComponent
} from './action-definition/action-definition.component';
import {
  ActionInstanceComponent
} from './action-instance/action-instance.component';
import { FloatingMenuComponent } from './floating-menu/floating-menu.component';
import { SetInputsComponent } from './set-inputs/set-inputs.component';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { TopBarComponent } from './top-bar/top-bar.component';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ActionDefinitionComponent,
        ActionInstanceComponent,
        AppComponent,
        FloatingMenuComponent,
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
        MatToolbarModule
      ],
      providers: [
        ElectronService
      ]
    })
    .compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app)
      .toBeTruthy();
  }));
});
