import {UserAtom, Post} from "../shared/data";
import {GraphQlService} from "gql";

import {Widget, Field, AfterInit} from "client-bus";


@Widget({fqelement: "Post", ng2_providers: [GraphQlService]})
export class PostsComponent implements AfterInit {
  @Field("User") author: UserAtom;
  posts: Post[];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this._graphQlService
      .get(`
        user(username: "${this.author.username}") {
          posts {
            content
          }
        }
      `)
      .subscribe(posts => this.posts = posts);
  }
}
