import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus, Field, AfterInit} from "client-bus";

import {TargetAtom, AuthorAtom, CommentAtom, Comment} from "../../shared/data";


@Widget({fqelement: "Comment", ng2_providers: [GraphQlService]})
export class ShowCommentsComponent implements AfterInit {
  @Field("Target") target: TargetAtom;
  @Field("Author") author: AuthorAtom;

  comments: any[];
  fetched = false;

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const update_comments = () => {
      if (this.fetched) return;
      this.fetched = true;
      const author_id = this.author.atom_id ? this.author.atom_id : "";
      const target_id = this.target.atom_id ? this.target.atom_id : "";

      this.comments = [];
      this._graphQlService
        .get(`
          getComments(
            author_id: "${author_id}",
            target_id: "${target_id}"
          ) {
            atom_id,
            content,
            author {
              atom_id,
              name
            },
            target {
              atom_id
            }
          }
        `)
        .map(data => data.getComments)
        .flatMap((comments, unused_ix) => Observable.from(comments))
        .map((comment: Comment) => {
          const comment_atom = this._clientBus.new_atom<CommentAtom>("Comment");
          comment_atom.atom_id = comment.atom_id;
          comment_atom.content = comment.content;
          comment_atom.author = this._clientBus.new_atom<AuthorAtom>("Author");
          comment_atom.author.atom_id = comment.author.atom_id;
          comment_atom.author.name = comment.author.name;
          comment_atom.target = this._clientBus.new_atom<TargetAtom>("Target");
          comment_atom.target.atom_id = comment.target.atom_id;
          return comment_atom;
        })
        .subscribe(comment_atom => {
          this.comments.push(comment_atom);
        });
    };

    update_comments();
    this.target.on_change(update_comments);
  }
}
