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

@Component({
  selector: 'dv-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnChanges {
  @Input() readonly pageType: PageType;
  @Output() selectedPage = new EventEmitter<PageType>();
  isSavable: boolean;
  readonly dejavu = 'Déjà Vu';
  otherPages: PageInfo[];

  ngOnChanges() {
    console.log(this.pageType);
    this.otherPages = pages.filter(page => page.type !== this.pageType);
    this.isSavable = (this.pageType === PageType.UI_EDITOR);
  }

  handleRedirectClick(type) {
    const that = this;
    that.selectedPage.emit(type);
  }
}
