import {Widget, Field} from "client-bus";

@Widget({
  fqelement: "Feed",
  template: `
    <div class="row">
      <message [msg]="message"></message>
    </div>
    <div class="row">
      by <publisher [pub]="publisher"></publisher>
    </div>
  `
})
export class ShowFeedItemComponent {
  @Field("Message") message;
  @Field("Publisher") publisher;
  @Field("Subscriber") subscriber;
}
