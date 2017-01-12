import {Widget, ClientBus, field} from "client-bus";


@Widget({
  ng2_providers: [{provide: "fqelement", useValue: "dv-samples-morg"}]
})
export class GroupMeetingComponent {
  group_meeting = {};
  constructor(client_bus: ClientBus) {
    client_bus.init(this, [field("group_meeting", "GroupMeeting")]);
  }
}
