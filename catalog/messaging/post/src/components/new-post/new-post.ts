import {Post, Username} from "../../shared/data";
import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  ng2_providers: [GraphQlService]
})
export class NewPostComponent {
  username: Username;
  post: Post = {atom_id: "", content: ""};
  submitted: boolean = false;

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    this._graphQlService
      .post(`
        newPost(author: "${this.username}", content: "${this.post.content}") {
          atom_id
        }
      `)
      .subscribe(atom_id => {
        this.post.atom_id = atom_id;
        this.submitted = true;
      });
  }
}
