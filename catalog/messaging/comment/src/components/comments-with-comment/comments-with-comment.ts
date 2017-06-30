import {Widget, Field} from "client-bus";


@Widget({
  fqelement: "Comment",
  template: `
    <div class="list-group">
      <div class="list-group-item-text">
        <dv-widget name="Comments"></dv-widget>
      </div>
      <div class="list-group-item-text">
        <dv-widget name="NewComment"></dv-widget>
      </div>
    </div>
  `
})
export class CommentsWithCommentComponent {
  @Field("Author") author;
  @Field("Target") target;
}
