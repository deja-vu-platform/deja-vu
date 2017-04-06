import {Post, Username} from "../../shared/data";
import {GraphQlService} from "gql";

import {Widget} from "client-bus";

@Widget({
  fqelement: "Post",
  ng2_providers: [GraphQlService]
})
export class EditPostComponent {
  username: Username;
  editedContent: string;
  post: Post = null;
  isEditing = false;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.editedContent = this.post.content;
  }

  startEditing() {
    this.isEditing = true;
  }

  stopEditing() {
    this.isEditing = false;
  }

  onSubmit() {
    this._graphQlService
      .post(`
        editPost(
          atom_id: "${this.post.atom_id}",
          content: "${this.editedContent}"
        ) { atom_id }
      `).subscribe(() => {
        this.isEditing = false;
        this.post.content = this.editedContent;
      });
  }
}
