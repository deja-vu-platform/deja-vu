import {bootstrap} from "angular2/platform/browser";
import {HTTP_PROVIDERS} from "angular2/http";
import {FeedPatternComponent} from "./feed-pattern.component";

import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/observable/fromArray";

bootstrap(FeedPatternComponent, [HTTP_PROVIDERS]);
