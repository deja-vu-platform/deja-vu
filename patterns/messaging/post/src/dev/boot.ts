import {provide} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {PostPatternComponent} from "./post-pattern.component";

import {Composer} from "composer";

import "rxjs/add/operator/map";

const loc = "http://localhost:3000";

const APIS = {post: loc};

bootstrap(
  PostPatternComponent, [
    provide("post.api", {useValue: APIS.post}),
    provide(Composer, {useValue: new Composer("post", loc)})
  ]);
