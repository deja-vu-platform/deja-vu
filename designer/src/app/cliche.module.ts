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

import * as dvDocs from '@deja-vu/core/pkg/documentation.json';
dv['documentation'] = dvDocs;

import * as authenDocs from '@deja-vu/authentication/pkg/documentation.json';
authentication['documentation'] = authenDocs;
import * as authoriDocs from '@deja-vu/authorization/pkg/documentation.json';
authorization['documentation'] = authoriDocs;
import * as commentDocs from '@deja-vu/comment/pkg/documentation.json';
comment['documentation'] = commentDocs;
import * as eventDocs from '@deja-vu/event/pkg/documentation.json';
event['documentation'] = eventDocs;
import * as followDocs from '@deja-vu/follow/pkg/documentation.json';
follow['documentation'] = followDocs;
import * as geolocDocs from '@deja-vu/geolocation/pkg/documentation.json';
geolocation['documentation'] = geolocDocs;
import * as groupDocs from '@deja-vu/group/pkg/documentation.json';
group['documentation'] = groupDocs;
import * as labelDocs from '@deja-vu/label/pkg/documentation.json';
label['documentation'] = labelDocs;
import * as passkeyDocs from '@deja-vu/passkey/pkg/documentation.json';
passkey['documentation'] = passkeyDocs;
import * as propertyDocs from '@deja-vu/property/pkg/documentation.json';
property['documentation'] = propertyDocs;
import * as rankingDocs from '@deja-vu/ranking/pkg/documentation.json';
ranking['documentation'] = rankingDocs;
import * as ratingDocs from '@deja-vu/rating/pkg/documentation.json';
rating['documentation'] = ratingDocs;
import * as scoringDocs from '@deja-vu/scoring/pkg/documentation.json';
scoring['documentation'] = scoringDocs;
import * as taskDocs from '@deja-vu/task/pkg/documentation.json';
task['documentation'] = taskDocs;
import * as transferDocs from '@deja-vu/transfer/pkg/documentation.json';
transfer['documentation'] = transferDocs;

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

const outputTypeRegex = /EventEmitter<(.*)>/;

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
const configWizardComponentName = 'ConfigWizardComponent';

function isComponent(f: any) {
  return f && _.isString(f.name) && f.name.endsWith(componentSuffix);
}

function isAction(f: any) {
  return isComponent(f) && f.name !== configWizardComponentName;
}

function isConfigWizardComponent(f: any) {
  return isComponent(f) && f.name === configWizardComponentName;
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
      .filter(isAction)
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

        // parse the template to get the action map
        // since angular uses valid HTML, we can use built-in dom methods
        const template: string = component.decorators[0].args[0].template;
        if (actionInputNames.length > 0) {
          const div = document.createElement('div');
          div.innerHTML = template;
          const includes = Array.from(div.getElementsByTagName('dv-include'));
          includes.forEach((include) => {
            const inputName = include.getAttribute('[action]');
            const inputsAttr = (include.getAttribute('[inputs]') || '');
            const inputsRes = /{([\s\S]*?)}/.exec(inputsAttr);
            if (inputsRes && inputsRes[1]) {
              // TODO: handle legitimate uses of : or , (e.g. in strings)
              actionInputs[inputName] = _.fromPairs(
                inputsRes[1]
                  .split(',')
                  .map((s1) => s1.split(':'))
                  .filter(([ioName, propertyName]) => ioName && propertyName)
                  .map(([ioName, propertyName]) => [
                    removeSurroundingQuotes(ioName.trim()),
                    propertyName.trim()
                  ])
                  .filter(([ioName, propertyName]) => ioName && propertyName)
              );
            }
          });
          div.remove();
        }

        actionInputNames.forEach((actionInputName) => {
          if (!actionInputs[actionInputName]) {
            actionInputs[actionInputName] = {};
          }
        });

        if (template.includes('ng-content')) {
          inputs.push('*content');
          actionInputs['*content'] = {};
        }

        inputs.sort();
        outputs.sort();

        const actionName = _.kebabCase(component.name
          .slice(0, componentSuffix.length * -1));

        let description = '';
        const ioDescriptions = {
          hidden: '(boolean) If true, do not display the action'
        };
        const moduleDocs = importedModule['documentation'];
        if (moduleDocs) {
          const componentDocs = moduleDocs.components
            .find((c) => c.name === component.name);
          if (componentDocs) {
            description = htmlToText(componentDocs.description);
            // extract type argument from EventEmitter for outputs
            // the default value is tried first because type is sometimes
            //   missing the type argument
            componentDocs.outputsClass.forEach((ioDocs) => {
              ioDocs.type = _.get(outputTypeRegex.exec(ioDocs.defaultValue), 1)
                || _.get(outputTypeRegex.exec(ioDocs.type), 1)
                || 'any';
            });
            [
              ...componentDocs.inputsClass,
              ...componentDocs.outputsClass
            ].forEach((ioDocs) => {
              let { type, description: ioDescription } = ioDocs;
              const { defaultValue, name } = ioDocs;
              // compodoc doesn't infer types based on defaults
              if (!type) {
                if (defaultValue) {
                  try {
                    // tslint:disable-next-line no-eval
                    type = typeof eval(defaultValue);
                  } catch (e) {
                    type = 'any';
                  }
                } else {
                  type = 'any';
                }
              }
              ioDescription = ioDescription || '';
              ioDescriptions[name] = `(${type}) ${htmlToText(ioDescription)}`;
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
      .sort((cd1, cd2) => cd1.name < cd2.name ? -1 : 1),
    configWizardComponent: Object.values(importedModule)
      .find(isConfigWizardComponent)
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
