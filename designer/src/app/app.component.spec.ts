import { async, TestBed } from '@angular/core/testing';
import {
  MatDialogModule,
  MatExpansionModule,
  MatIconModule,
  MatListModule,
  MatSnackBarModule,
  MatToolbarModule
} from '@angular/material';
import { ElectronService } from 'ngx-electron';

import {
  ActionDefinitionComponent
} from './action-definition/action-definition.component';
import {
  ActionInstanceComponent
} from './action-instance/action-instance.component';
import { AppComponent } from './app.component';
import { RowComponent } from './row/row.component';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { TopBarComponent } from './top-bar/top-bar.component';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ActionDefinitionComponent,
        ActionInstanceComponent,
        AppComponent,
        TopBarComponent,
        SideMenuComponent,
        RowComponent
      ],
      imports: [
        MatDialogModule,
        MatExpansionModule,
        MatIconModule,
        MatListModule,
        MatSnackBarModule,
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
