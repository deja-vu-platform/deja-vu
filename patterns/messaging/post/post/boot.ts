import {bootstrap} from 'angular2/platform/browser';
import {HTTP_PROVIDERS} from 'angular2/http';
import {PostPatternComponent} from './post-pattern.component';

import 'rxjs/add/operator/map';

bootstrap(PostPatternComponent, [HTTP_PROVIDERS]);
