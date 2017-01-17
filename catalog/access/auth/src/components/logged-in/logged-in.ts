import {Widget} from "client-bus";


@Widget({fqelement: "dv-access-auth", template: ""})
export class LoggedInComponent {
  user = {username: "", password: "", read: [], write: []};

  dvAfterInit() {
    console.log(localStorage.getItem("username"));
    this.user.username = localStorage.getItem("username");
  }
}
