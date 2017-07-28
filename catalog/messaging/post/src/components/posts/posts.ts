import {UserAtom, Post, PostAtom} from "../shared/data";
import {GraphQlService} from "gql";

import {Widget, Field, AfterInit, ClientBus} from "client-bus";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";


@Widget({fqelement: "Post", ng2_providers: [GraphQlService]})
export class PostsComponent implements AfterInit {
  @Field("User") author: UserAtom;
  posts: PostAtom[];
  lastId: string;

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    this.author.on_change(() => {
      if (this.author.atom_id && this.author.atom_id !== this.lastId) {
        this._getPosts();
      }
      this.lastId = this.author.atom_id;
    });
    if (this.author.atom_id) {
      this._getPosts();
      this.lastId = this.author.atom_id;
    }
  }

  _getPosts() {
    this.posts = [];
    this._graphQlService
      .get(`
        postsByAuthor(
          author_id: "${this.author.atom_id}"
        ) {
          atom_id,
          content
        }
      `)
      .map(data => data.postsByAuthor)
      .flatMap((posts, unused_ix) => Observable.from(posts))
      .map((post: Post) => {
        const post_atom = this._clientBus.new_atom<PostAtom>("Comment");
        post_atom.atom_id = post.atom_id;
        post_atom.content = post.content;
        post_atom.author = this.author;
        return post_atom;
      })
      .subscribe(post_atom => {
        this.posts.push(post_atom);
      });
  }
}
