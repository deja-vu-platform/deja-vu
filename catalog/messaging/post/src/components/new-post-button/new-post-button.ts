import {HTTP_PROVIDERS} from "angular2/http";

import {Post, User} from "../../shared/data";
import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  ng2_providers: [GraphQlService, HTTP_PROVIDERS]
})
export class NewPostButtonComponent {
  submitted;
  post: Post = {content: ""};
  user: User = {username: "", posts: []};

  constructor(private _graphQlService: GraphQlService) {}

  valid(): boolean {
    return this.post.content !== "";
  }

  create() {
    console.log(
        "at new-post-button on save, got post " + this.post.content);
    this._graphQlService
      .post(`
        newPost(
          author: "${this.user.username}", content: "${this.post.content}") {
          atom_id
        }
      `)
      .subscribe(data => {
        this.submitted.value = true;
        this.post["atom_id"] = data.atom_id;
        // const user_up = {$addToSet: {posts: {atom_id: data.atom_id}}};
        // this._client_bus.report_update(user_up, this._user);
      });
  }
}
