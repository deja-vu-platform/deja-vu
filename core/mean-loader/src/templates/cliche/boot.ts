import {NgModule, Component} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {FormsModule} from "@angular/forms";
import {HttpModule} from "@angular/http";

import {WidgetLoader, ClientBus} from "client-bus";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";


@@wid_imports


@Component({
  selector: "root",
  template: `
     This is the development page, widgets: @@wid_names 
     <div class="container">
       @@wid_selectors
     </div>
  `,
  providers: [
    {provide: "fqelement", useValue: "@@name"},
    {provide: "CompInfo", useValue: {}},
    {provide: "WCompInfo", useValue: {}},
    {provide: "ReplaceMap", useValue: {}},
    {provide: "locs", useValue: @@locs},
    {provide: "app", useValue: ""},
    ClientBus]
})
class RootComponent {}

let declarations: any[] = [RootComponent, WidgetLoader];
declarations = declarations.concat(@@wid_classes);

@NgModule({
  imports: [BrowserModule, FormsModule, HttpModule],
  declarations: declarations,
  bootstrap: [RootComponent],
  entryComponents: @@wid_classes
})
export class RootModule {}

platformBrowserDynamic().bootstrapModule(RootModule);
