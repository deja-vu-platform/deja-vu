import { Component, Input, OnInit } from '@angular/core';
import {
  App
} from '../datatypes';


@Component({
  selector: 'app-theme-palette',
  templateUrl: './theme-palette.component.html',
  styleUrls: ['./theme-palette.component.scss']
})
export class ThemePaletteComponent implements OnInit {
  @Input() readonly app: App;

  ngOnInit() {
    this.setTheme('@deja-vu/themes/compiled-css/default.css');
  }

  setTheme(link) {
    let cssString;

    // this is used because require needs a constant string
    switch(link) {
      case '@deja-vu/themes/compiled-css/baby-blue.css': {
        cssString = require('@deja-vu/themes/compiled-css/baby-blue.css');
        break;
      }
      case '@deja-vu/themes/compiled-css/basil-green.css': {
        cssString = require('@deja-vu/themes/compiled-css/basil-green.css');
        break;
      }
      case '@deja-vu/themes/compiled-css/bright-blue.css': {
        cssString = require('@deja-vu/themes/compiled-css/bright-blue.css');
        break;
      }
      case '@deja-vu/themes/compiled-css/business-red.css': {
        cssString = require('@deja-vu/themes/compiled-css/business-red.css');
        break;
      }
      case '@deja-vu/themes/compiled-css/minimalist.css': {
        cssString = require('@deja-vu/themes/compiled-css/minimalist.css');
        break;
      }
      case '@deja-vu/themes/compiled-css/mint.css': {
        cssString = require('@deja-vu/themes/compiled-css/mint.css');
        break;
      }
      case '@deja-vu/themes/compiled-css/orange-and-black.css': {
        cssString = require('@deja-vu/themes/compiled-css/orange-and-black.css');
        break;
      }
      case '@deja-vu/themes/compiled-css/sakura.css': {
        cssString = require('@deja-vu/themes/compiled-css/sakura.css');
        break;
      }
      case '@deja-vu/themes/compiled-css/soft-green.css': {
        cssString = require('@deja-vu/themes/compiled-css/soft-green.css');
        break;
      }
      case '@deja-vu/themes/compiled-css/stylish-pink.css': {
        cssString = require('@deja-vu/themes/compiled-css/stylish-pink.css');
        break;
      }
      case '@deja-vu/themes/compiled-css/sugar.css': {
        cssString = require('@deja-vu/themes/compiled-css/sugar.css');
        break;
      }
      case '@deja-vu/themes/compiled-css/vibrant-teal.css': {
        cssString = require('@deja-vu/themes/compiled-css/vibrant-teal.css');
        break;
      }
      case '@deja-vu/themes/compiled-css/vivid-green.css': {
        cssString = require('@deja-vu/themes/compiled-css/vivid-green.css');
        break;
      }
      default: {
        cssString = require('@deja-vu/themes/compiled-css/default.css');
        break;
      }
    }

    const style = document.createElement('style');
    const head = document.head || document.getElementsByTagName('head')[0];
    head.removeChild(head.lastChild);
    head.appendChild(style);
    style.appendChild(document.createTextNode(cssString));
  }
}
