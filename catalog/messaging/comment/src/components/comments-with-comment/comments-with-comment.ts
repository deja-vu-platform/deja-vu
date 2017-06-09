import {Widget, ClientBus, field} from "client-bus";


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
  author = {name: ""};
  target = {name: ""};

  constructor(client_bus: ClientBus) {
    client_bus.init(this, [
        field("author", "Author"),
        field("target", "Target")]);
  }
}
