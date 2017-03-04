import {Post} from "../../shared/data";

import {Widget} from "client-bus";


@Widget({fqelement: "dv-messaging-post"})
export class NewPostContentComponent {
  post: Post = {content: ""};
  submit_ok = {value: false, on_after_change: _ => undefined};

  dvAfterInit() {
    this.submit_ok.on_after_change(() => {
      this.post.atom_id = undefined;
      this.post.content = "";
    });
  }
}
