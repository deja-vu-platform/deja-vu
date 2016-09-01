import {HTTP_PROVIDERS} from "angular2/http";

import {Post} from "../../shared/data";

import {Widget} from "client-bus";


@Widget({
  ng2_providers: [HTTP_PROVIDERS]
})
export class NewPostContentComponent {
  post: Post = {content: ""};
}
