import {Widget, WidgetLoader} from "client-bus";


@Widget({
  ng2_directives: [WidgetLoader]
})
export class TopicsComponent {
  username: string;

  loggedInUser(username: string) {
    console.log("got username <" + username + ">");
    this.username = username;
  }
}
