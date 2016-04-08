import {provide} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {DevComponent} from "./dev.component";

import "rxjs/add/operator/map";


const APIS = {label: "http://localhost:3000"};


bootstrap(
  DevComponent, [
    provide("label.api", {useValue: APIS.label})
  ]);
