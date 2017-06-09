import {Widget} from "client-bus";


@Widget({fqelement: "Auth", template: ""})
export class LoggedInComponent {
  user = {atom_id: "", username: "", password: ""};

  dvAfterInit() {
    console.log(localStorage.getItem("username"));
    this.user.username = localStorage.getItem("username");
    this.user.atom_id = localStorage.getItem("atom_id");
  }
}
