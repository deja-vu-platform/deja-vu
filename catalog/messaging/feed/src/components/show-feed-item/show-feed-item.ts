import {Widget} from "client-bus";

@Widget({
  fqelement: "Feed",
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
