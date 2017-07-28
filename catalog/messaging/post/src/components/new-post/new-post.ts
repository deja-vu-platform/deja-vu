import {PostAtom, UserAtom} from "../shared/data";

import {Widget, Field} from "client-bus";


@Widget({fqelement: "Post"})
export class NewPostComponent {
  @Field("Post") post: PostAtom;
  @Field("User") author: UserAtom;
}
