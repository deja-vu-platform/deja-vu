import { Component , OnInit} from '@angular/core';

import {Dimensions} from './components/common/utility/utility';
import {Widget, UserWidget} from './models/widget/widget';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';

  outerContainerDimensions: Dimensions = {
    width: 1000,
    height: 2000
  };

  screenDimensions: Dimensions = {
    width: 1000,
    height: 2000
  };

  selectedWidget = new UserWidget('test', {height: 100, width: 200}, '1234');
  allWidgets = new Map<string, Map<string, Widget>>();

  ngOnInit() {
    Widget.addWidgetToAllWidgets(this.allWidgets, this.selectedWidget);
  }
}
