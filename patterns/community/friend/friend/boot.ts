import {bootstrap} from 'angular2/platform/browser';
import {HTTP_PROVIDERS} from 'angular2/http';
import {FriendPatternComponent} from './friend-pattern.component';

import 'rxjs/add/operator/map';

bootstrap(FriendPatternComponent, [HTTP_PROVIDERS]);
