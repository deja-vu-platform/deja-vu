import { Component, OnInit } from '@angular/core';

@Component({
  selector: '<%= dasherize(clicheName) %>-<%= dasherize(componentName) %>',
  templateUrl: './<%= dasherize(componentName) %>.component.html',
  styleUrls: ['./<%= dasherize(componentName) %>.component.css']
})
export class <%= classify(componentName) %>Component implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
