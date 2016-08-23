import {Component, Input} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {Post, Username} from "../../shared/data";
import {GraphQlService} from "gql";


@Component({
  selector: "new-post",
  templateUrl: "./components/new-post/new-post.html",
  providers: [GraphQlService, HTTP_PROVIDERS]
})
export class NewPostComponent {
  @Input() username: Username;
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
