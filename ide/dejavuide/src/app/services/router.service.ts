import { Injectable } from '@angular/core';

import { Project } from '../../models/project/project';
import { Router } from '@angular/router';
// BehaviorSubject as opposed to Subject since we want an initial value right
// upon subscription
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export enum PageType {
  PROJECT_EXPLORER, UI_EDITOR, CLICHES
}

export interface PageInfo {
  title: string;
  type: PageType | null;
}

const pages: PageInfo[] = [
  {
    title: 'Projects',
    type: PageType.PROJECT_EXPLORER
  },
  {
    title: 'Cliches',
    type: PageType.CLICHES
  },
  {
    title: 'Widgets',
    type: PageType.UI_EDITOR
  }];

const pageToUrl: Map<PageType, string> = new Map([
  [PageType.PROJECT_EXPLORER, '/projects'],
  [PageType.UI_EDITOR, '/ui-editor'],
  [PageType.CLICHES, '/cliche-list']
]);

@Injectable()
export class RouterService {
  private selectedPageType = PageType.PROJECT_EXPLORER;
  newPageType = new BehaviorSubject<PageType>(this.selectedPageType);

  constructor(private router: Router) {}

  public navigateTo(pageType: PageType): Promise<boolean> {
    this.selectedPageType = pageType;
    this.setLocalStoragePageType();
    this.newPageType.next(this.selectedPageType);
    return this.router.navigate([pageToUrl.get(pageType)]);
  }

  public getSelectedPage(): PageInfo {
    if (!this.selectedPageType) {
      this.selectedPageType = parseInt(localStorage.getItem('pageType'), 10);
      if (!this.selectedPageType) {
        this.selectedPageType = PageType.PROJECT_EXPLORER;
        this.setLocalStoragePageType();
      }
    }
    return this.getPageInfo(this.selectedPageType);
  }

  public getPageInfo(type: PageType) {
    let pageInfo = null;
    pages.forEach((page) => {
      if (page.type === type) {
        pageInfo = page;
      }
    });
    return pageInfo;
  }

  public getOtherPages(type: PageType) {
    return pages.filter(page => page.type !== type);
  }

  public isSaveable(type: PageType) {
    return type === PageType.UI_EDITOR;
  }

  private setLocalStoragePageType() {
    localStorage.setItem('pageType', JSON.stringify(this.selectedPageType));
  }
}
