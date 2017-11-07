import { Component } from '@angular/core';

export enum PageType {
  PROJECT_EXPLORER, UI_EDITOR
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  PageType = PageType;
  selectedPage = PageType.PROJECT_EXPLORER;

  selectPage(pageType: PageType) {
    this.selectedPage = pageType;
  }
}
