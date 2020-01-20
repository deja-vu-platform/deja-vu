import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { map } from 'rxjs/operators';

import { ElectronService } from 'ngx-electron';

import {
  AfterClosedData,
  ConfigureConceptComponent,
  DialogData
} from '../configure-concept/configure-concept.component';
import {
  App,
  AppComponentDefinition,
  ComponentDefinition,
  ConceptInstance
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
    console.log('SET THEME!!');
    console.log(document);
    const sss = require('@deja-vu/themes/compiled-css/vivid-green.css');
    console.log(sss);
    const style = document.createElement('style');
    const head = document.head || document.getElementsByTagName('head')[0];
    head.appendChild(style);
    style.appendChild(document.createTextNode(sss));
  }
}
