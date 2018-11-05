import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import { DragulaModule } from 'ng2-dragula';
import { QuillModule } from 'ngx-quill';

import { GATEWAY_URL, DvModule } from 'dv-core';

import { MatModule } from './mat.module';
import { ClicheModule } from './cliche.module';

import { WidgetDirective } from './widget.directive';

import { AppComponent } from './app.component';
import { MainViewComponent } from './main-view/main-view.component';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { ClicheListComponent } from './cliche-list/cliche-list.component';
import { WidgetListComponent } from './widget-list/widget-list.component';
import { PageComponent } from './page/page.component';
import { WidgetComponent } from './widget/widget.component';
import { RowComponent } from './row/row.component';
import { TextComponent } from './text/text.component';

@NgModule({
  declarations: [
    AppComponent,
    MainViewComponent,
    SideMenuComponent,
    TopBarComponent,
    ClicheListComponent,
    WidgetListComponent,
    PageComponent,
    WidgetDirective,
    WidgetComponent,
    RowComponent,
    TextComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatModule,
    DragulaModule.forRoot(),
    QuillModule,
    DvModule,
    ClicheModule,
  ],
  providers: [
    { provide: GATEWAY_URL, useValue: 'http://localhost:8080/api' },
  ],
  bootstrap: [AppComponent],
  entryComponents: [TextComponent],
})
export class AppModule { }
