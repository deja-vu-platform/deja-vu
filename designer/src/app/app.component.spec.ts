import { async, TestBed } from '@angular/core/testing';
import {
  MatExpansionModule,
  MatListModule,
  MatToolbarModule
} from '@angular/material';

import { AppComponent } from './app.component';
import { ClicheListComponent } from './cliche-list/cliche-list.component';
import { MainViewComponent } from './main-view/main-view.component';
import { PageComponent } from './page/page.component';
import { RowComponent } from './row/row.component';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { WidgetListComponent } from './widget-list/widget-list.component';
import { WidgetComponent } from './widget/widget.component';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        TopBarComponent,
        MainViewComponent,
        SideMenuComponent,
        PageComponent,
        ClicheListComponent,
        RowComponent,
        WidgetListComponent,
        WidgetComponent
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
