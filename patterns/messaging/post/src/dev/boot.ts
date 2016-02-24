import {provide} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {PostPatternComponent} from "./post-pattern.component";

import "rxjs/add/operator/map";


const APIS = {post: "http://localhost:3000"};

bootstrap(
  PostPatternComponent, [
    provide("post.api", {useValue: APIS.post})
  ]);
