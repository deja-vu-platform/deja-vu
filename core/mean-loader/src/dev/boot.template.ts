import {Component, provide, PLATFORM_DIRECTIVES} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {ROUTER_PROVIDERS, RouteConfig, ROUTER_DIRECTIVES}
from "angular2/router";

import {ClientBus} from "client-bus";


@@wid_imports
@@attachments_imports

const COMP_INFO = @@comp_info;
const WCOMP_INFO = @@wcomp_info;
const NAME = "@@name";
const MODE = "@@mode";
const ATTACHMENTS = @@wid_attachments;
const LOCS = @@locs;

const WID_NAMES = @@wid_names;



let providers = [];

providers = providers.concat(
  Object.keys(LOCS)
    .map(cliche_i => {
      const cliche_i_split = cliche_i.split("-");
      let name = cliche_i_split[2];
      if (cliche_i_split.length === 4) {
        name = name + "-" + cliche_i_split[3];
      }
      return provide(name + ".api", {useValue: LOCS[cliche_i]});
    }));

providers = providers.concat([
    ROUTER_PROVIDERS,
    provide("fqelement", {useValue: NAME}),
    provide("locs", {useValue: LOCS}),
    provide("CompInfo", {useValue: COMP_INFO}),
    provide("WCompInfo", {useValue: WCOMP_INFO}),
    ClientBus
    ]);

providers = providers.concat(
  ATTACHMENTS
    .map(a => provide(PLATFORM_DIRECTIVES, {useValue: a, multi: true})));


let template;
let directives;
if (MODE === "dev") {
  template = `
     This is the development page, widgets: {{wid_names}}
     <div class="container">
       @@wid_selectors
     </div>
  `;
  directives = @@wid_directives;
} else {
  template = `<router-outlet></router-outlet>`;
  directives = [ROUTER_DIRECTIVES];
}

@Component({
  selector: "root",
  template: template,
  directives: directives
})
@@route_config
class RootComponent {}
  
bootstrap(RootComponent, providers);
