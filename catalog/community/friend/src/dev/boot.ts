import {provide} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {FriendPatternComponent} from "./friend-pattern.component";

import "rxjs/add/operator/map";


const APIS = {friend: "http://localhost:3000"};


bootstrap(
  FriendPatternComponent, [
    provide("friend.api", {useValue: APIS.friend})
  ]);
