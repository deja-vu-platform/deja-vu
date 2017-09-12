import {Widget, AfterInit, Field, ClientBus} from "client-bus";

import {GraphQlService} from "gql";
import "rxjs/add/operator/toPromise";

import Atomize from "../_shared/atomize";
import {PublisherAtom, FollowerAtom} from "../_shared/data";
import FollowService from "../_shared/follow.service";


@Widget({
  fqelement: "Follow",
  ng2_providers: [
    GraphQlService,
    FollowService
  ]
})
export class EditFollowsOfFollowerComponent implements AfterInit {
  @Field("Follower") follower: FollowerAtom;
  publishers: PublisherAtom[] = [];

  constructor(
    private _atomize: Atomize,
    private _clientBus: ClientBus,
    private _followService: FollowService,
  ) {}

  dvAfterInit() {
    this._followService.getPublishersByFollower(this.follower.atom_id)
      .then(publishers => {
        this.follower.follows = publishers.map(publisher => 
          this._atomize.atomizePublisher(publisher)
        )
      });
    
    this._followService.getPublishers()
      .then(publishers => {
        this.publishers = publishers.map(publisher => 
          this._atomize.atomizePublisher(publisher)
        )
      });
  }
}