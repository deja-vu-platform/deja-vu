import { async, TestBed } from '@angular/core/testing';
import {
  MatExpansionModule,
  MatListModule,
  MatToolbarModule
} from '@angular/material';

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
        MatToolbarModule,
        MatExpansionModule,
        MatListModule
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
