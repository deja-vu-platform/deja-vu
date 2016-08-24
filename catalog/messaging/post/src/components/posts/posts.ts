import {OnInit} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {Post, Username} from "../../shared/data";
import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  ng2_providers: [GraphQlService, HTTP_PROVIDERS]
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
