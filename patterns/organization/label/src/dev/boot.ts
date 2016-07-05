import {provide} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {DevComponent} from "./dev.component";


import "rxjs/add/operator/map";


const loc = "http://localhost:3000";

const APIS = {label: loc};


bootstrap(
  DevComponent, [
    provide("label.api", {useValue: APIS.label}),
    provide("element", {useValue: "label"}),
    provide("loc", {useValue: loc}),
    provide("CompInfo", {useValue: {}})
  ]);
