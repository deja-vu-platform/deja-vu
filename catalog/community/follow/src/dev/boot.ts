import {provide} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {FollowPatternComponent} from "./follow-pattern.component";

import "rxjs/add/operator/map";


const APIS = {follow: "http://localhost:3000"};


bootstrap(
  FollowPatternComponent, [
    provide("follow.api", {useValue: APIS.follow})
  ]);
