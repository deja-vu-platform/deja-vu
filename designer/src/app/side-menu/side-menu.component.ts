import { Component, Input, OnInit } from '@angular/core';
import { designerCliche } from '../cliche.module';
import { ActionDefinition, App } from '../datatypes';

interface ActionCollection {
  name: string;
  actions: ActionDefinition[];
}

const NUM_CONSTANT_COLLECTIONS = 2;

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent implements OnInit {
  @Input() app: App;
  // need consistent object to return
  private _actionCollections: ActionCollection[];

  ngOnInit() {
    this._actionCollections = [designerCliche, this.app];
  }

  get actionCollections(): ActionCollection[] {
    this._actionCollections.splice(NUM_CONSTANT_COLLECTIONS);
    this._actionCollections.push.apply(
      this._actionCollections,
      this.app.cliches
        .sort(({ name: nameA }, { name: nameB }) =>
          nameA === nameB ? 0 : (nameA < nameB ? -1 : 1)
        )
    );

    return this._actionCollections;
  }
}
