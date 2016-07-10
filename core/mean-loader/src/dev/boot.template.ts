import {Component, provide, PLATFORM_DIRECTIVES} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {ROUTER_PROVIDERS} from "angular2/router";


@@wid_imports

const COMP_INFO = @@comp_info;
const LOCS = @@locs;
const NAME = "@@name";
const WIDGETS = @@widgets;
const ATTACHMENTS = @@wid_attachments;


let providers = [];

providers.concat(
  Object.keys(LOCS)
    .map(cliche_i => provide(cliche_i + ".api", {useValue: LOCS[cliche_i]})));

providers.concat([
    ROUTER_PROVIDERS,
    provide("element", {useValue: NAME}),
    provide("loc", {useValue: LOCS[NAME]}),
    provide("CompInfo", {useValue: COMP_INFO})
    ]);

providers.concat(
  ATTACHMENTS
    .map(a => provide(PLATFORM_DIRECTIVES, {useValue: a, multi: true})));


@Component({
  selector: "dev",
  template: `
     This is the development page, widgets: {{widgets}}
     @@wid_selectors
  `,
  directives: @@wid_directives
})
class DevComponent {
  widgets = WIDGETS;
}


bootstrap(DevComponent, providers);
