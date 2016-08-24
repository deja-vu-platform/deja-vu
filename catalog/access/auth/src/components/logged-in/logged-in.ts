import {Output, EventEmitter, OnInit} from "angular2/core";

import {Widget} from "client-bus";


@Widget({template: ""})
export class LoggedInComponent implements OnInit {
  @Output() loggedInUser = new EventEmitter();

  ngOnInit() {
    console.log(localStorage.getItem("username"));
    this.loggedInUser.emit(localStorage.getItem("username"));
  }
}
