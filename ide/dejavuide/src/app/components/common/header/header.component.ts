import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { PageTypes } from '../../../app.component';

interface PageInfo {
  title: string;
  type: PageTypes | null;
}

const pages: PageInfo[] = [
  {
    title: 'Projects',
    type: PageTypes.PROJECT_EXPLORER
  },
  {
    title: 'Cliches',
    type: null
  },
  {
    title: 'Widgets',
    type: PageTypes.UI_EDITOR
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
export class HeaderComponent implements OnInit {
  @Input() readonly pageTitle: string;
  @Output() selectedPage = new EventEmitter<PageTypes>();
  isSavable: boolean;
  readonly dejavu = 'Déjà Vu';
  otherPages: PageInfo[];

  ngOnInit() {
    this.otherPages = pages.filter(page => page.title !== this.pageTitle);
    this.isSavable = (this.pageTitle === 'Widgets'
      || this.pageTitle === 'Data' );
  }

  handleRedirectClick(title) {
    const that = this;
    pages.forEach((pageInfo) => {
      if (pageInfo.title === title) {
        that.selectedPage.emit(pageInfo.type);
      }
    });
  }
}
