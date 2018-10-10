import { Component, Input } from '@angular/core';
import { ComposedWidget } from '../datatypes';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss'],
})
export class PageComponent {
  @Input() composedWidget: ComposedWidget;

  get rows() {
    return this.composedWidget.rows
      .map((row, index) => Object.assign({ index }, row));
  }
}
