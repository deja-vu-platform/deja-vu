import {Post, Username} from "../../shared/data";
import {GraphQlService} from "gql";

import {Widget} from "client-bus";

@Widget({
  fqelement: "dv-messaging-post",
  ng2_providers: [GraphQlService]
})
export class EditPostComponent {
  username: Username;
  editedContent: string;
  fields: {post: Post};
  isEditing = false;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.editedContent = this.fields.post.content;
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
          atom_id: "${this.fields.post.atom_id}",
          content: "${this.editedContent}"
        ) { atom_id }
      `).subscribe(() => {
        this.isEditing = false;
        this.fields.post.content = this.editedContent;
      });
  }
}
