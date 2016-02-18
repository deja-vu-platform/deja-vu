import {bootstrap} from "angular2/platform/browser";
import {SocialNetworkComponent} from "./social-network.component";

// For friends
import {HTTP_PROVIDERS} from "angular2/http";
import "rxjs/add/operator/map";

bootstrap(SocialNetworkComponent, [HTTP_PROVIDERS]);
