import {bootstrap} from "angular2/platform/browser";
import {HTTP_PROVIDERS} from "angular2/http";
import {FeedPatternComponent} from "./feed-pattern.component";

import "rxjs/add/operator/map";

bootstrap(FeedPatternComponent, [HTTP_PROVIDERS]);
