import {Widget, ClientBus, field} from "client-bus";
import {provide} from "angular2/core";


@Widget({
  ng2_providers: [provide("fqelement", {useValue: "dv-samples-morg"})]
})
export class GroupMeetingComponent {
  group_meeting = {};
  constructor(client_bus: ClientBus) {
    client_bus.init(this, [field("group_meeting", "GroupMeeting")]);
  }
}
