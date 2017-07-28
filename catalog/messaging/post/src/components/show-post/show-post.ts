import "rxjs/add/operator/toPromise";

import {Widget, ClientBus, Field, AfterInit} from "client-bus";
import {PostAtom, UserAtom} from "../shared/data";

import {GraphQlService} from "gql";


@Widget({
  fqelement: "Post",
  ng2_providers: [GraphQlService],
  template: `{{post?.author?.username}}`
})
export class ShowPostComponent implements AfterInit {
  @Field("Post") post: PostAtom;
  private fetched = false;

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const update_post = () => {
      if (!this.post.atom_id || this.fetched) return;
      this.fetched = true;

      return this._graphQlService
        .get(`
          post_by_id(atom_id: "${this.post.atom_id}") {
            author {
              atom_id,
              username
            }
          }
        `)
        .toPromise()
        .then(data => data.post_by_id)
        .then(post => {
          if (this.post.author === undefined) {
            this.post.author = this._clientBus.new_atom<UserAtom>("Author");
          }
          this.post.author.atom_id = post.author.atom_id;
          this.post.author.username = post.author.username;
        });
    };
    update_post();
    this.post.on_change(update_post);
  }
}
