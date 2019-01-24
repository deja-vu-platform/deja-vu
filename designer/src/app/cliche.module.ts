import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import * as _ from 'lodash';

import * as allocator from 'allocator';
import * as authentication from 'authentication';
import * as authorization from 'authorization';
import * as event from 'event';
import * as follow from 'follow';
import * as geolocation from 'geolocation';
import * as group from 'group';
import * as passkey from 'passkey';
import * as property from 'property';
import * as rating from 'rating';
import * as task from 'task';
import * as transfer from 'transfer';

import { ClicheDefinition } from './datatypes';
import { TextComponent } from './text/text.component';

// TODO: import platform actions (e.g. button, link, etc.)

const importedCliches: { [name: string]: Object} = {
  allocator,
  authentication,
  authorization,
  event,
  follow,
  geolocation,
  group,
  passkey,
  property,
  rating,
  task,
  transfer
};


// each imported Cliche Module has an Angular Module
// which we need to import and export
function getNgModule(importedModule: Object): any {
  return Object
    .entries(importedModule)
    .filter(([key]) => key.endsWith('Module'))[0][1];
}

const modules: any[] = Object.values(importedCliches)
  .map(getNgModule);


// create Cliche Definitions from imported Cliche Modules
const componentSuffix = 'Component';

function clicheDefinitionFromModule(
  importedModule: Object,
  name: string
): ClicheDefinition {
  return {
    name,
    actions: Object.values(importedModule)
      .filter((f) => _.isString(f.name) && f.name.endsWith(componentSuffix))
      .map((component) => ({
        name: _.kebabCase(component.name
          .slice(0, componentSuffix.length * -1)),
        component,
        inputs: [], // TODO
        outputs: [] // TODO
      }))
  };
}

export const clicheDefinitions = _
  .map(importedCliches, clicheDefinitionFromModule);


// built-in components are added manually
export const designerCliche: ClicheDefinition = {
  name: 'dv-d',
  actions: [{
    name: 'text',
    component: <Component>TextComponent,
    inputs: [],
    outputs: []
  }]
};


@NgModule({
  imports: [CommonModule].concat(modules),
  exports: modules,
  declarations: []
})
export class ClicheModule { }
