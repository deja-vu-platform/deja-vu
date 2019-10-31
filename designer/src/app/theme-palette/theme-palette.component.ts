import { Component, EventEmitter, Input, Output } from '@angular/core';
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
export class ThemePaletteComponent {
  @Input() readonly app: App;

  constructor(
    private readonly dialog: MatDialog,
    private readonly electronService: ElectronService) {}

}
