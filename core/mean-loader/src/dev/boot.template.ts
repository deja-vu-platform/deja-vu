import {Component, provide, PLATFORM_DIRECTIVES} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {ROUTER_PROVIDERS} from "angular2/router";


const COMP_INFO = @@comp_info;
const LOCS = @@locs;
const NAME = "@@name";


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

providers.concat([
//    provide(
//      PLATFORM_DIRECTIVES, {useValue: PostComponent, multi: true}),
//    provide(
//      PLATFORM_DIRECTIVES, {useValue: UserComponent, multi: true}),
    ]);

@Component({
  selector: "dev",
  templateUrl: "This is the development page"
})
class DevComponent {
}


bootstrap(DevComponent, providers);
