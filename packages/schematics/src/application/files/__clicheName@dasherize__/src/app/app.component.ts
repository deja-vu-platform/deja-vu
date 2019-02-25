import { Component } from '@angular/core';

@Component({
  selector: '<%= dasherize(clicheName) %>-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = '<%= clicheName %>';
}
