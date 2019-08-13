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
  ComponentDefinition,
  App,
  AppComponentDefinition,
  ConceptInstance
} from '../datatypes';

import * as _ from 'lodash';


@Component({
  selector: 'app-concept-instances',
  templateUrl: './concept-instances.component.html',
  styleUrls: ['./concept-instances.component.scss']
})
export class ConceptInstancesComponent {
  @Input() readonly app: App;
  @Output() readonly conceptAdded = new EventEmitter<ConceptInstance>();
  @Output() readonly conceptRemoved = new EventEmitter<string>();

  constructor(
    private readonly dialog: MatDialog,
    private readonly electronService: ElectronService) {}

  private openConfigureDialog(
    then: (data: AfterClosedData) => void,
    concept?: ConceptInstance
  ) {
    const data: DialogData = {
      app: this.app,
      concept
    };
    this.dialog
      .open(ConfigureConceptComponent, {
        width: '50vw',
        data
      })
      .afterClosed()
      .pipe(
        map((result?: AfterClosedData): AfterClosedData =>
          result || { event: 'cancel'}
        )
      )
      .subscribe(then);
  }

  newConceptInstance() {
    this.openConfigureDialog(({ event, concept }) => {
      if (event === 'create') {
        this.conceptAdded.emit(concept);
      }
    });
  }

  editConceptInstance(concept: ConceptInstance) {
    const origName = concept.name;
    this.openConfigureDialog(({ event, concept: newConcept }) => {
      if (event === 'update') {
        this.conceptRemoved.emit(origName);
        this.conceptAdded.emit(newConcept);
      } else if (event === 'delete') {
        this.conceptRemoved.emit(origName);
      }
    }, concept);
  }

  deleteConceptInstance(ci: ConceptInstance) {
    if (window.confirm(
      'Are you sure you want to remove this concept instance? ' +
      'All of the components of this concept instance ' +
      'that you are using will be removed as well.'
    )) {
      this.app.deleteConceptInstance(ci);
    }
  }

  docs(ci: ConceptInstance) {
    if (this.electronService.remote) {
      this.electronService.shell
        .openExternal(
          'https://github.com/spderosso/deja-vu/blob/master/packages/' +
          `catalog/${ci.name}/README.md`);
    }
  }
}
