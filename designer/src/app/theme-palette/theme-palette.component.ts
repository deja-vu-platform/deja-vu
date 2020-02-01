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

  themes: string[] = [
    'Default', 'Baby Blue', 'Basil Green', 'Bright Blue', 'Business Red',
    'Minimalist', 'Mint', 'Orange and Black', 'Sakura', 'Soft Green',
    'Stylish Pink', 'Sugar', 'Vibrant Teal', 'Vivid Green'
  ];

  ngOnInit() {
    // this.setTheme('Default');
  }

  setTheme(themeName) {
    let cssString;

    // this is used because require needs a constant string
    switch (themeName) {
      case 'Default': {
        cssString = require('@deja-vu/themes/compiled-css/default.css');
      }
      case 'Baby Blue': {
        cssString = require('@deja-vu/themes/compiled-css/baby-blue.css');
        break;
      }
      case 'Basil Green': {
        cssString = require('@deja-vu/themes/compiled-css/basil-green.css');
        break;
      }
      case 'Bright Blue': {
        cssString = require('@deja-vu/themes/compiled-css/bright-blue.css');
        break;
      }
      case 'Business Red': {
        cssString = require('@deja-vu/themes/compiled-css/business-red.css');
        break;
      }
      case 'Minimalist': {
        cssString = require('@deja-vu/themes/compiled-css/minimalist.css');
        break;
      }
      case 'Mint': {
        cssString = require('@deja-vu/themes/compiled-css/mint.css');
        break;
      }
      case 'Orange and Black': {
        cssString = require('@deja-vu/themes/compiled-css/orange-and-black.css');
        break;
      }
      case 'Sakura': {
        cssString = require('@deja-vu/themes/compiled-css/sakura.css');
        break;
      }
      case 'Soft Green': {
        cssString = require('@deja-vu/themes/compiled-css/soft-green.css');
        break;
      }
      case 'Stylish Pink': {
        cssString = require('@deja-vu/themes/compiled-css/stylish-pink.css');
        break;
      }
      case 'Sugar': {
        cssString = require('@deja-vu/themes/compiled-css/sugar.css');
        break;
      }
      case 'Vibrant Teal': {
        cssString = require('@deja-vu/themes/compiled-css/vibrant-teal.css');
        break;
      }
      case 'Vivid Green': {
        cssString = require('@deja-vu/themes/compiled-css/vivid-green.css');
        break;
      }
      default: {
        throw new Error('Theme name [' + themeName + '] is not handled');
      }
    }

    const style = document.createElement('style');
    const head = document.head || document.getElementsByTagName('head')[0];
    head.removeChild(head.lastChild);
    head.appendChild(style);
    style.appendChild(document.createTextNode(cssString));
  }
}
