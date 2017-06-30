import {PostAtom} from "../shared/data";

import {Widget, Field, PrimitiveAtom, AfterInit} from "client-bus";


@Widget({fqelement: "Post"})
export class NewPostContentComponent implements AfterInit {
  @Field("Post") post: PostAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  dvAfterInit() {
    this.submit_ok.on_after_change(() => {
      this.post.atom_id = undefined;
      this.post.content = "";
    });
  }
}
