import { Component, OnInit } from '@angular/core';

import { ɵe as CreateWeeklySeriesComponent } from 'event'; // TODO: proper import

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss'],
})
export class PageComponent implements OnInit {
  widgets = [CreateWeeklySeriesComponent];

  constructor() { }

  ngOnInit() {
  }

}
