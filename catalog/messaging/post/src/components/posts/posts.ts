import {OnInit} from "@angular/core";

import {Post, Username} from "../../shared/data";
import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-messaging-post",
  ng2_providers: [GraphQlService]
})
export class PostsComponent implements OnInit {
  username: Username;
  posts: Post[];

  constructor(private _graphQlService: GraphQlService) {}

  ngOnInit() {
    console.log("got as input " + this.username);
    this._graphQlService
      .get(`
        user(username: "${this.username}") {
          posts {
            content
          }
        }
      `)
      .subscribe(posts => this.posts = posts);
  }
}
