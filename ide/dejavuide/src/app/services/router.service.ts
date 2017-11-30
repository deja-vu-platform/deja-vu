import { Injectable } from '@angular/core';

import { Project } from '../models/project/project';
import { Router } from '@angular/router';
import { ReplaySubject } from 'rxjs/ReplaySubject';

export enum PageType {
  PROJECT_EXPLORER, UI_EDITOR
}

const pageToUrl: Map<PageType, string> = new Map([
  [PageType.PROJECT_EXPLORER, '/projects'],
  [PageType.UI_EDITOR, '/ui_editor']
]);

@Injectable()
export class RouterService {
  private selectedPageType: PageType;
  newPageType = new ReplaySubject<PageType>(1);

  constructor(private router: Router) {
  }


  public navigateTo(pageType: PageType): Promise<boolean> {
    this.selectedPageType = pageType;
    this.newPageType.next(this.selectedPageType);
    return this.router.navigate([pageToUrl.get(pageType)]);
  }

  public getSelectedPageType(): PageType {
    return this.selectedPageType;
  }
}
