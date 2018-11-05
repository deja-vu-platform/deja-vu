import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import * as Allocator from 'allocator';
import * as Authentication from 'authentication';
import * as Authorization from 'authorization';
import * as EventDV from 'event';
import * as Follow from 'follow';
import * as Geolocation from 'geolocation';
import * as Group from 'group';
import * as Passkey from 'passkey';
import * as Property from 'property';
import * as Rating from 'rating';
import * as Task from 'task';
import * as Transfer from 'transfer';

import { isString } from '../utils';
import { Cliche, ClicheComponents } from './datatypes';
import { TextComponent } from './text/text.component';

const importedCliches = {
  Allocator,
  Authentication,
  Authorization,
  Event: EventDV,
  Follow,
  Geolocation,
  Group,
  Passkey,
  Property,
  Rating,
  Task,
  Transfer,
};

function getNamedComponents(importedModule) {
  const namedComponents: ClicheComponents = {};
  Object.values(importedModule)
    .filter(f => isString(f['name']) && f['name'].endsWith('Component'))
    .forEach(c => namedComponents[c['name'].slice(0, -9)] = c);
  return namedComponents;
}

function getModule(importedModule) {
  return Object
    .entries(importedModule)
    .filter(([key]) => key.endsWith('Module'))[0][1];
}

const modules: any[] = Object.values(importedCliches).map(getModule);

export const cliches: { [clicheName: string]: Cliche } = {};

Object.entries(importedCliches).forEach(([name, clicheModule]) => {
  const components = getNamedComponents(clicheModule);
  const cliche = { name, components };
  cliches[name] = cliche;
});

// built-in components are loaded manually
cliches['Déjà Vu'] = {
  name: 'Déjà Vu',
  components: {
    Text: <Component>TextComponent,
  },
};

@NgModule({
  imports: [
    CommonModule,
    ...modules,
  ],
  exports: modules,
  declarations: [],
})
export class ClicheModule { }
