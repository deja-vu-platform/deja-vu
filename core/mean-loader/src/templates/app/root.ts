import {NgModule, Component} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {RouterModule, Routes} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {HttpModule} from "@angular/http";

import {WidgetLoader, RouteLoader, ClientBus, Widget, Field,
  DvLink} from "client-bus";

import * as _ustring from "underscore.string";

@@wid_imports


export function AppWidget() {
  return (target: Function): any => {
    const dname = _ustring.dasherize(target.name).slice(1, -10);
    const metadata = {
      selector: dname,
      providers: [{provide: "wname", useValue: target.name.slice(0, -9)}]
    };
    metadata["templateUrl"] = `components/${dname}/${dname}.html`;
    metadata["styleUrls"] = [`components/${dname}/${dname}.css`];
    return Component(metadata)(target);
  };
}

@@wid_definitions

const MODE: string = "@@mode";


let template;
if (MODE === "dev") {
  template = `
     This is the development page, widgets: @@wid_names
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
    {provide: "NCompInfo", useValue: @@ncomp_info},
    {provide: "ReplaceMap", useValue: @@replace_map},
    {provide: "locs", useValue: @@locs},
    {provide: "app", useValue: "@@name"},
    {provide: "RouteConfig", useValue: @@route_config},
    ClientBus]
})
class RootComponent {}

let declarations: any[] = [RootComponent, WidgetLoader, RouteLoader, DvLink];
declarations = declarations.concat(@@wid_classes);

@NgModule({
  imports: [
    BrowserModule, RouterModule.forRoot([{path: '**', component: RouteLoader}]),
    FormsModule, HttpModule],
  declarations: declarations,
  bootstrap: [RootComponent],
  entryComponents: @@wid_classes
})
export class RootModule {}
