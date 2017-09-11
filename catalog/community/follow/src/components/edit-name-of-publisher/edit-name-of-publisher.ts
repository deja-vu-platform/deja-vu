import {Widget, Field, PrimitiveAtom} from "client-bus";
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
export class EditNameOfPublisherComponent {
  @Field("Publisher") publisher: PublisherAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failMsg: string;
  private fetched: string;

  constructor(private _followService: FollowService) {}

  dvAfterInit() {
    if (this.publisher.atom_id && !this.publisher.name) {
      this.fetch();
    } else {
      this.fetched = this.publisher.atom_id;
    }

    this.publisher.on_change(() => this.fetch());

    this.submit_ok.on_change(() => {
      if (
        this.submit_ok.value &&
        this.publisher.atom_id &&
        this.publisher.name
      ) {
        return this._followService
          .updateNameOfPublisher(
            this.publisher.atom_id,
            this.publisher.name
          )
          .then(success => {
            this.failMsg = success ? "" : "Failed to update publisher name.";
          });
      }
    });

    this.submit_ok.on_after_change(() => {
      this.publisher.name = "";
    });
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
    this._followService
      .getNameOfPublisher(this.publisher.atom_id)
      .then(name => this.publisher.name = name);
  }
}