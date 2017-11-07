import { Component } from '@angular/core';

export enum PageTypes {
  PROJECT_EXPLORER, UI_EDITOR
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  PageTypes = PageTypes;
  selectedPage = PageTypes.PROJECT_EXPLORER;

  selectPage(pageType: PageTypes) {
    this.selectedPage = pageType;
  }
}
