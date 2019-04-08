import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import * as _ from 'lodash';

import * as dv from '@deja-vu/core';

import * as allocator from '@deja-vu/allocator';
import * as authentication from '@deja-vu/authentication';
import * as authorization from '@deja-vu/authorization';
import * as comment from '@deja-vu/comment';
import * as event from '@deja-vu/event';
import * as follow from '@deja-vu/follow';
import * as geolocation from '@deja-vu/geolocation';
import * as group from '@deja-vu/group';
import * as label from '@deja-vu/label';
import * as passkey from '@deja-vu/passkey';
import * as property from '@deja-vu/property';
import * as ranking from '@deja-vu/ranking';
import * as rating from '@deja-vu/rating';
import * as scoring from '@deja-vu/scoring';
import * as task from '@deja-vu/task';
import * as transfer from '@deja-vu/transfer';

import * as propertyDocs from '@deja-vu/property/documentation.json';
property['documentation'] = propertyDocs;

import {
  ActionInputs,
  App,
  ClicheActionDefinition,
  ClicheDefinition,
  OMNIPRESENT_INPUTS
} from './datatypes';
import { TextComponent } from './text/text.component';

const importedCliches: { [name: string]: Object} = {
  allocator,
  authentication,
  authorization,
  comment,
  event,
  follow,
  geolocation,
  group,
  label,
  passkey,
  property,
  ranking,
  rating,
  scoring,
  task,
  transfer
};

/**
 * Converts a string of HTML to a string of the text it would render
 * (i.e. strips tags and converts codes to characters)
 */
function htmlToText(html: string): string {
  const div = document.createElement('div');
  div.style.display = 'none';
  div.innerHTML = html;
  const text = div.innerText;
  div.remove();

  return text;
}

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
importedCliches['dv'] = dv;
const componentSuffix = 'Component';

function isComponent(f: any) {
  return f && _.isString(f.name) && f.name.endsWith(componentSuffix);
}

function removeSurroundingQuotes(s: string): string {
  if (s.length <= 1) { return s; }

  const first = _.first(s);
  const last = _.last(s);
  // tslint:disable-next-line quotemark
  if (first === last && (last === '"' || last === "'")) {
    return s.slice(1, -1);
  }

  return s;
}

function clicheDefinitionFromModule(
  importedModule: Object,
  moduleName: string
): ClicheDefinition {
  return {
    name: moduleName,
    actions: Object.values(importedModule)
      .filter(isComponent)
      .map((component): ClicheActionDefinition => {
        // get inputs and outputs
        const inputs = OMNIPRESENT_INPUTS.slice();
        const outputs = [];
        const actionInputs: ActionInputs = {};
        _.forEach(component.propDecorators, (val, key) => {
          const type = val[0].type.prototype.ngMetadataName;
          if (type === 'Input') {
            inputs.push(key);
          } else if (type === 'Output') {
            outputs.push(key);
          }
        });

        // detect action inputs
        let instance;
        try {
          instance = new component();
        } catch {
          instance = {};
          // TODO: figure out how to handle components that err on undef inputs
        }

        const actionInputNames = inputs.filter((input) =>
          isComponent(_.get(instance, [input, 'type']))
        );

        const template: string = component.decorators[0].args[0].template;
        // parse the template string to extract the object map
        // TODO: stop assuming zero or one action input per action
        if (actionInputNames.length > 0) {
          const inputMapMatch = template.match(/\[inputs\]="{([\s\S]*?)}"/);
          if (inputMapMatch) {
            actionInputs[actionInputNames[0]] = _.fromPairs(
              inputMapMatch[1]
                .split(',')
                .map((s1) => {
                  let [ioName, propertyName] = s1.split(':');
                  ioName = removeSurroundingQuotes(ioName.trim());
                  propertyName = propertyName.trim();

                  return [propertyName, ioName];
                })
            );
          } else {
            actionInputs[actionInputNames[0]] = {};
          }
        }

        if (template.includes('ng-content')) {
          inputs.push('*content');
          actionInputs['*content'] = {};
        }

        inputs.sort();
        outputs.sort();

        const actionName = _.kebabCase(component.name
          .slice(0, componentSuffix.length * -1));

        let description = '';
        const ioDescriptions = {};
        const moduleDocs = importedModule['documentation'];
        if (moduleDocs) {
          const componentDocs = moduleDocs.components
            .find((c) => c.name === component.name);
          if (componentDocs) {
            description = htmlToText(componentDocs.description);
            [
              ...componentDocs.inputsClass,
              ...componentDocs.outputsClass
            ].forEach((ioDocs) => {
              ioDescriptions[ioDocs.name] = htmlToText(ioDocs.description);
            });
          }
        }

        return {
          name: actionName,
          component,
          inputs,
          outputs,
          actionInputs,
          description,
          ioDescriptions
        };
      })
      .sort((cd1, cd2) => cd1.name < cd2.name ? -1 : 1)
  };
}

export const clicheDefinitions = _
  .map(importedCliches, clicheDefinitionFromModule);

const dvClicheIdx = clicheDefinitions.findIndex((cd) => cd.name === 'dv');
const [dvCliche] = clicheDefinitions.splice(dvClicheIdx, 1);
// TODO: filter actions in dvCliche

App.clicheDefinitions = clicheDefinitions;
App.dvCliche = dvCliche;

export const dvCoreActions = dvCliche.actions
  .map(({ component: c }) => <any>c);

dvCliche.actions.push(({
  name: 'text',
  component: <Component>TextComponent,
  inputs: [],
  outputs: [],
  actionInputs: {},
  description: 'Display custom text, images, and other content',
  ioDescriptions: {}
}));

@NgModule({
  imports: [CommonModule].concat(modules),
  exports: modules,
  declarations: []
})
export class ClicheModule { }
