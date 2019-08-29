import { Component, OnInit } from '@angular/core';

@Component({
  selector: '<%= dasherize(conceptName) %>-<%= dasherize(componentName) %>',
  templateUrl: './<%= dasherize(componentName) %>.component.html',
  styleUrls: ['./<%= dasherize(componentName) %>.component.css']
})
export class <%= classify(componentName) %>Component implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
