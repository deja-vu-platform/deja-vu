import {Post, User} from "../../shared/data";
import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-messaging-post",
  ng2_providers: [GraphQlService]
})
export class NewPostButtonComponent {
  submit_ok = {value: false};
  post: Post = {content: ""};
  author: User = {username: "", posts: []};

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
          author: "${this.author.username}", content: "${this.post.content}") {
          atom_id
        }
      `)
      .subscribe(data => {
        this.post["atom_id"] = data.newPost.atom_id;
        this.submit_ok.value = true;
      });
  }
}
