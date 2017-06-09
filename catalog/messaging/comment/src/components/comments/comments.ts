import {GraphQlService} from "gql";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {Widget, ClientBus} from "client-bus";


export interface Author {
  atom_id: string;
  name: string;
}

export interface Comment {
  atom_id: string;
  content: string;
  author: Author;
}


@Widget({fqelement: "Comment", ng2_providers: [GraphQlService]})
export class CommentsComponent {
  comments: any[];
  fetched = false;
  target = {name: "", atom_id: "", on_change: _ => undefined};

  constructor(
    private _graphQlService: GraphQlService, private _clientBus: ClientBus) {}

  dvAfterInit() {
    const update_comments = () => {
      if (!this.target.atom_id || this.fetched) return;
      this.fetched = true;

      console.log("got target" + this.target.atom_id);
      this.comments = [];
      return this._graphQlService
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
          const comment_atom: Comment = this._clientBus.new_atom("Comment");
          comment_atom.atom_id = comment.atom_id;
          comment_atom.content = comment.content;
          comment_atom.author = this._clientBus.new_atom("Author");
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
