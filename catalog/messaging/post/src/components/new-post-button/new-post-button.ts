import {HTTP_PROVIDERS} from "angular2/http";

import {Post, User} from "../../shared/data";
import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  ng2_providers: [GraphQlService, HTTP_PROVIDERS]
})
export class NewPostButtonComponent {
  submit_ok = {value: false};
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
        this.post["atom_id"] = data.newPost.atom_id;
        this.submit_ok.value = true;
      });
  }
}
