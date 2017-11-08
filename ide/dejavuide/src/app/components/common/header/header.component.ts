import { Component, Input, Output, OnChanges, EventEmitter } from '@angular/core';
import { PageType } from '../../../app.component';

interface PageInfo {
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
    type: null
  },
  {
    title: 'Widgets',
    type: PageType.UI_EDITOR
  },
  {
    title: 'Data',
    type: null
  }];

function getTitle(pageType: PageType): string {
  let title = 'Invalid Page';
  pages.forEach((page) => {
    if (page.type === pageType) {
      title = page.title;
    }
  });
  return title;
}

@Component({
  selector: 'dv-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnChanges {
  @Input() readonly pageType: PageType;
  @Output() selectedPage = new EventEmitter<PageType>();
  @Output() saveClicked = new EventEmitter<boolean>();
  isSavable: boolean;
  readonly dejavu = 'Déjà Vu';
  otherPages: PageInfo[];
  pageTitle: string;

  ngOnChanges() {
    this.otherPages = pages.filter(page => page.type !== this.pageType);
    this.isSavable = (this.pageType === PageType.UI_EDITOR);
    this.pageTitle = getTitle(this.pageType);
  }

  handleRedirectClick(type) {
    this.selectedPage.emit(type);
  }

  handleSaveClicked() {
    this.saveClicked.emit(true);
  }
}
