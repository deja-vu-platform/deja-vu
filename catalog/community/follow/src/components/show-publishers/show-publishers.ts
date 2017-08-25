import {Widget} from "client-bus";
import {GraphQlService} from "gql";

import Atomize from "../_shared/atomize";
import {PublisherAtom} from "../_shared/data";
import FollowService from "../_shared/follow.service";


@Widget({
  fqelement: "Follow",
  ng2_providers: [
    GraphQlService,
    FollowService,
    Atomize
  ]
})
export class ShowPublishersComponent {
  publishers: PublisherAtom[] = [];

  constructor(
    private _groupService: FollowService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    this.publishers = [];
    this._groupService.getPublishers()
      .then(publishers => {
        this.publishers = publishers.map(publisher => {
          return this._atomize.atomizeFollower(publisher);
        });
      });
  }
}