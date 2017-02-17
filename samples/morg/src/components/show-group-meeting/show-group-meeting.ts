import {Widget, ClientBus, field} from "client-bus";


@Widget({fqelement: "dv-samples-morg"})
export class ShowGroupMeetingComponent {
  group_meeting = {};
  weekly_group_meeting = {};

  constructor(client_bus: ClientBus) {
    client_bus.init(this, [
        field("group_meeting", "GroupMeeting"),
        field("weekly_group_meeting", "WeeklyGroupMeeting")
        ]);
  }
}
