<<<<<<< HEAD

import { Component } from '@angular/core';

import { Project } from './models/project/project';
import { RouterService, PageType } from './services/router.service';

=======
import { Component } from '@angular/core';

>>>>>>> 7b0b57b86363049aee602e5f90346efa90de77f1
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
<<<<<<< HEAD
  PageType = PageType;
  selectedPage = PageType.PROJECT_EXPLORER;

  constructor(private routerService: RouterService) {}
=======
>>>>>>> 7b0b57b86363049aee602e5f90346efa90de77f1
}
