import {NgModule, Component} from "@angular/core";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {BrowserModule} from "@angular/platform-browser";
import {RouterModule, Routes} from "@angular/router";

import {WidgetLoader, ClientBus} from "client-bus";


@@wid_imports

const MODE = "@@mode";

const WID_NAMES = @@wid_names;

const appRoutes: Routes = @@route_config;


let template;
if (MODE === "dev") {
  template = `
     This is the development page, widgets: ${WID_NAMES}
     <div class="container">
       @@wid_selectors
     </div>
  `;
} else {
  template = `<router-outlet></router-outlet>`;
}

@Component({
  selector: "root",
  template: template,
  providers: [
    {provide: "fqelement", useValue: "@@name"},
    {provide: "CompInfo", useValue: @@comp_info},
    {provide: "WCompInfo", useValue: @@wcomp_info},
    {provide: "locs", useValue: @@locs},
    ClientBus]
})
class RootComponent {}


@NgModule({
  imports: [BrowserModule, RouterModule.forRoot(appRoutes)],
  declarations: [RootComponent, WidgetLoader],
  bootstrap: [RootComponent]
})
export class RootModule {}

platformBrowserDynamic().bootstrapModule(RootModule);
