import {Component, Output, EventEmitter, OnInit} from "angular2/core";

// import {User} from "../../shared/data";


@Component({
  selector: "logged-in",
  template: ""
})
export class LoggedInComponent implements OnInit {
  @Output() loggedInUser = new EventEmitter();

  ngOnInit() {
    console.log(localStorage.getItem("username"));
    this.loggedInUser.emit(localStorage.getItem("username"));
  }
}
