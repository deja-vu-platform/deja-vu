import {Widget} from "client-bus";

import {HTTP_PROVIDERS} from "angular2/http";
import {GraphQlService} from "gql";


@Widget({
  ng2_providers: [GraphQlService, HTTP_PROVIDERS],
  template: `
    {{post?.author?.username}}
  `
})
export class AuthorComponent {
  post = {on_change: undefined, atom_id: undefined, author: undefined};
  fetched = false;
  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    const update_post = () => {
      if (this.post.atom_id === undefined || this.fetched) return;
      this.fetched = true;

      console.log("Fetching author");
      return this._graphQlService
        .get(`
          post_by_id(atom_id: "${this.post.atom_id}") {
            author {
              username
            }
          }
        `)
        .map(data => data.post_by_id)
        .subscribe(post => {
          this.post.author = post.author;
        });
    };
    update_post();
    this.post.on_change(update_post);
  }
}
