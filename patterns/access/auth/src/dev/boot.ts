import {bootstrap} from "angular2/platform/browser";
import {HTTP_PROVIDERS} from "angular2/http";
import {AuthPatternComponent} from "./auth-pattern.component";

import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/observable/fromArray";

bootstrap(AuthPatternComponent, [HTTP_PROVIDERS]);
