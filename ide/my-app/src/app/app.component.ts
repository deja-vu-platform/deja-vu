import { Component } from '@angular/core';

import {Dimensions} from './components/common/utility/utility';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  outerContainerDimensions: Dimensions = {
    width: 100,
    height: 200
  };

  widgetDimensions: Dimensions = {
    width: 10,
    height: 20
  };

  screenDimensions: Dimensions = {
    width: 1000,
    height: 2000
  };


}
