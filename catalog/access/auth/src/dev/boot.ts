import {provide} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {AuthPatternComponent} from "./auth-pattern.component";

import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/observable/fromArray";


const APIS = {auth: "http://localhost:3000"};


bootstrap(
  AuthPatternComponent, [
    provide("auth.api", {useValue: APIS.auth})
  ]);
