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

  comments: any[];
  fetched = false;

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const update_comments = () => {
      if (!this.target.atom_id || this.fetched) return;
      this.fetched = true;

      this.comments = [];
      this._graphQlService
        .get(`
          target_by_id(atom_id: "${this.target.atom_id}") {
            comments {
              atom_id,
              content,
              author {
                atom_id,
                name
              }
            }
          }
        `)
        .map(data => data.target_by_id.comments)
        .flatMap((comments, unused_ix) => Observable.from(comments))
        .map((comment: Comment) => {
          const comment_atom = this._clientBus.new_atom<CommentAtom>("Comment");
          comment_atom.atom_id = comment.atom_id;
          comment_atom.content = comment.content;
          comment_atom.author = this._clientBus.new_atom<AuthorAtom>("Author");
          comment_atom.author.atom_id = comment.author.atom_id;
          comment_atom.author.name = comment.author.name;
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
