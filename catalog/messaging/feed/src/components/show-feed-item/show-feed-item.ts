import {Widget} from "client-bus";

@Widget({
  fqelement: "dv-messaging-feed",
  template: `
    <div class="row">
      <message [msg]="msg"></message>
    </div>
    <div class="row">
      by <publisher [pub]="pub"></publisher>
    </div>
  `
})
export class ShowFeedItemComponent {
  msg = {};
  pub = {};
}
