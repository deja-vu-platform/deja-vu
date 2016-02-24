import {provide} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {SocialNetworkComponent} from "./social-network.component";

import "rxjs/add/operator/map";

const APIS = {friend: "@@dv-community-friend"};
bootstrap(
  SocialNetworkComponent, [
    provide("friend.api", {useValue: APIS.friend})
  ]);
