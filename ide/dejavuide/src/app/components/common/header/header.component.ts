import { Component, Input, OnInit } from '@angular/core';

interface PageInfo {
  title: string;
  url: string;
}

const pages: PageInfo[] = [{
  title: 'Cliches',
  url: '#'
}, {
  title: 'Widgets',
  url: '#'
}, {
  title: 'Data',
  url: '#'
}];

@Component({
  selector: 'dv-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Input() readonly pageTitle: string;
  isClichePage: boolean;
  readonly dejavu = 'Déjà Vu';
  otherPages: PageInfo[];

  ngOnInit() {
    this.otherPages = pages.filter(page => page.title !== this.pageTitle);
    this.isClichePage = (this.pageTitle === 'Cliches');
  }

  /**
   * Handles what happens when the user goes back to the projects page. 
   */
  handleBackToAllProjects() {
    // TODO
    return;
  }
}
