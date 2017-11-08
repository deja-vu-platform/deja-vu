
import { Component } from '@angular/core';

import { Project } from './models/project/project';
import { RouterService, PageType } from './services/router.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  PageType = PageType;
  selectedPage = PageType.PROJECT_EXPLORER;

  constructor(private routerService: RouterService) {}
}
