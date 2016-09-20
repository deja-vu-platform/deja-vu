import {Widget, ClientBus, field} from "client-bus";

import {provide} from "angular2/core";


// tmp hack
@Widget({
  template: `
    <div class="list-group">
      <h4 class="list-group-item-heading">
        <dv-widget name="Author" fqelement="dv-messaging-post"
         [fields]="fields" [hosts]="hosts">
        </dv-widget>
      </h4>
      <p class="list-group-item-text">
        {{post.content}}
      </p>
      <div class="list-group-item-text">
        <dv-widget name="Labels" fqelement="dv-organization-label"
         [fields]="fields" [hosts]="hosts">
        </dv-widget>
      </div>
      <div class="list-group-item-text">
        <dv-widget name="CommentsWithComment" fqelement="dv-messaging-comment"
         [fields]="fields" [hosts]="hosts">
        </dv-widget>
      </div>

    </div>
  `,
  ng2_providers: [provide("fqelement", {useValue: "dv-samples-bookmark"})]
})
export class FeedItemComponent {
  post = {};

  constructor(client_bus: ClientBus) {
    client_bus.init(this, [field("post", "Post")]);
  }
}
