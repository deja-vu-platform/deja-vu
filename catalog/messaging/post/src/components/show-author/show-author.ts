import {Widget, ClientBus} from "client-bus";

import {GraphQlService} from "gql";


@Widget({
  fqelement: "dv-messaging-post",
  ng2_providers: [GraphQlService],
  template: `{{post?.author?.username}}`
})
export class ShowAuthorComponent {
  post = {on_change: undefined, atom_id: undefined, author: undefined};
  private fetched = false;

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const update_post = () => {
      if (!this.post.atom_id || this.fetched) return;
      this.fetched = true;

      console.log("Fetching author");
      return this._graphQlService
        .get(`
          post_by_id(atom_id: "${this.post.atom_id}") {
            author {
              atom_id,
              username
            }
          }
        `)
        .map(data => data.post_by_id)
        .subscribe(post => {
          if (this.post.author === undefined) {
            this.post.author = this._clientBus.new_atom("Author");
          }
          this.post.author.atom_id = post.author.atom_id;
          this.post.author.username = post.author.username;
        });
    };
    update_post();
    this.post.on_change(update_post);
  }
}
