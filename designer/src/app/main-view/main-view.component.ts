import { Component, Input } from '@angular/core';
import { ComposedWidget } from '../datatypes';

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.scss']
})
export class MainViewComponent {
  @Input() composedWidget: ComposedWidget;
}
