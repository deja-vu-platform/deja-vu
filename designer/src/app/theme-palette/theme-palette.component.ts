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

  ngOnInit() { }

  setTheme() {
    const cssString = require('@deja-vu/themes/compiled-css/vivid-green.css');
    const style = document.createElement('style');
    const head = document.head || document.getElementsByTagName('head')[0];
    head.appendChild(style);
    style.appendChild(document.createTextNode(cssString));
  }
}
