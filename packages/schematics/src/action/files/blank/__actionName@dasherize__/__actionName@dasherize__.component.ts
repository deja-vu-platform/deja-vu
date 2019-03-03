import { Component, OnInit } from '@angular/core';

@Component({
  selector: '<%= dasherize(clicheName) %>-<%= dasherize(actionName) %>',
  templateUrl: './<%= dasherize(actionName) %>.component.html',
  styleUrls: ['./<%= dasherize(actionName) %>.component.css']
})
export class <%= classify(actionName) %>Component implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
