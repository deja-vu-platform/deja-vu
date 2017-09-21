import { Component, Input, OnInit } from '@angular/core';

interface pageInfo {
  title: string;
  url: string;
}

const pages: pageInfo[] = [{
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
export class HeaderComponent implements OnInit{
  @Input() readonly pageTitle: string;
  isClichePage: boolean;  
  readonly dejavu = 'Déjà Vu';
  otherPages: pageInfo[];

  ngOnInit(){
    this.otherPages = pages.filter(page => 
      page.title != this.pageTitle
    );
    this.isClichePage = (this.pageTitle == "Cliches");  
  }
  
  handleBackToAllProjects(){
    console.log(this.pageTitle);
    console.log(this.isClichePage);
    console.log(this.otherPages);
    return;
  }
}
