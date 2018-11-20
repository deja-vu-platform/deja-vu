import { Component, Input } from '@angular/core';
import { ComposedWidget } from '../datatypes';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss']
})
export class PageComponent {
  @Input() composedWidget = new ComposedWidget();
}
