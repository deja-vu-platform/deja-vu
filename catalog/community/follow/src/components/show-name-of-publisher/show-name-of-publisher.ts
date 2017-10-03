import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import {PublisherAtom} from "../_shared/data";
import FollowService from "../_shared/follow.service";


@Widget({
  fqelement: "Follow",
  ng2_providers: [
    GraphQlService,
    FollowService
  ]
})
export class ShowNameOfPublisherComponent {
  @Field("Publisher") publisher: PublisherAtom;

  private fetched: string;

  constructor(private _followService: FollowService) {}

  dvAfterInit() {
    if (this.publisher.atom_id && !this.publisher.name) {
      this.fetch();
    } else {
      this.fetched = this.publisher.atom_id;
    }

    this.publisher.on_change(() => this.fetch());
  }

  private fetch() {
    if (this.fetched !== this.publisher.atom_id) {
      this.fetched = this.publisher.atom_id;
      if (this.publisher.atom_id) {
        this.getName();
      } else {
        this.publisher.name = "";
      }
    }
  }

  private getName() {
    this._followService.getNameOfPublisher(this.publisher.atom_id)
      .then(name => this.publisher.name = name);
  }
}
