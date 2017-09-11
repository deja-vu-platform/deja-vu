import {Widget, Field, AfterInit, ClientBus} from "client-bus";

import {GraphQlService} from "gql";
import "rxjs/add/operator/toPromise";

import Atomize from "../_shared/atomize";
import {FollowerAtom, PublisherAtom} from "../_shared/data";
import FollowService from "../_shared/follow.service";
import {doesFollow} from "../_shared/utils";


@Widget({
  fqelement: "Follow",
  ng2_providers: [
    GraphQlService,
    FollowService
  ]
})
export class FollowUnfollowComponent implements AfterInit {
  @Field("Publisher") publisher: PublisherAtom;
  @Field("Follower") follower: FollowerAtom;

  _lastID: string = "";

  constructor(
    private _atomize: Atomize,
    private _clientBus: ClientBus,
    private _followService: FollowService
  ) {}

  dvAfterInit() {
    const getFollows = () => {
      this._followService.getPublishersByFollower(this.follower.atom_id)
        .then(publishers => {
          this.follower.follows = publishers.map(publisher => 
            this._atomize.atomizePublisher(publisher)
          )
        });
    }

    if (!this.follower.follows) {
      this.follower.follows = [];
    }
    if (this.follower.follows.length === 0 && this.follower.atom_id) {
      getFollows();
    }
    if (this.follower.atom_id) {
      this._lastID = this.follower.atom_id;
    }
    this.follower.on_change(() => {
      if (this._lastID !== this.follower.atom_id) {
        this._lastID = this.follower.atom_id;
        return getFollows();
      }
    });
  }

  follow() {
    this._followService.addFollow(this.follower.atom_id, this.publisher.atom_id)
      .then(success => {
        if (success) this.follower.follows.push(this.publisher);
      });
  }

  unfollow() {
    this._followService
      .removeFollow(this.follower.atom_id, this.publisher.atom_id)
      .then(success => {
        if (success) {
          filterInPlace(this.follower.follows, (followed) => {
             return followed.atom_id !== this.publisher.atom_id;
          });
        }
      });
  }

  doesFollow(follower: FollowerAtom, publisher: PublisherAtom): boolean {
    return doesFollow(follower, publisher);
  }
}

function filterInPlace<T>(arr: T[], f: (elm: T) => boolean): T[] {
  let out = 0;
  for (let i = 0; i < arr.length; i++) {
    if (f(arr[i])) {
      arr[out++] = arr[i];
    }
  }
  arr.length = out;
  return arr;
}