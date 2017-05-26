import {Comment} from "../comments/comments";
import {GraphQlService} from "gql";

import {Widget} from "client-bus";

@Widget({
  fqelement: "Comment",
  ng2_providers: [GraphQlService]
})
export class EditCommentComponent {
  editedContent: string;
  comment: Comment = null;
  isEditing = false;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.editedContent = this.comment.content;
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
        editComment(
          atom_id: "${this.comment.atom_id}",
          content: "${this.editedContent}"
        ) { atom_id }
      `).subscribe(() => {
        this.isEditing = false;
        this.comment.content = this.editedContent;
      });
  }
}
