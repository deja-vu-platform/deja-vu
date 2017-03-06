import {Widget, ClientBus, field} from "client-bus";


@Widget({fqelement: "dv-samples-morg"})
export class ShowGroupMeetingComponent {
  group_meeting = {};
  weekly_group_meeting = {};
  email = {value: ""};

  constructor(client_bus: ClientBus) {
    client_bus.init(this, [
        field("group_meeting", "GroupMeeting"),
        field("weekly_group_meeting", "WeeklyGroupMeeting"),
        field("email", "Text")
        ]);
    this.email.value = "deja-vu@mit.edu"; // TODO: update to correct email?
  }
}
