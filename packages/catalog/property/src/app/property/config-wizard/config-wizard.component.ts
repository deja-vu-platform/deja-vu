import { Component, Input, OnInit, Output } from '@angular/core';
import {
  FormControl,
  FormGroupDirective,
  NgForm
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { v4 as uuidv4 } from 'uuid';
import {
  jsonSchemaTypeToGraphQlType,
  Schema
} from '../../../../server/config-types';

export interface Config {
  schema: Schema;
  initialObjects: Object[];
}
export type propertyType = keyof typeof jsonSchemaTypeToGraphQlType;
export interface Property {
  name: string;
  type: string;
  required: boolean;
}

/**
 * Custom function for checking that the user provided a property value
 */
function isGiven(value: string | boolean) {
  return !(value === '' || value == null);
}

const types: Readonly<typeof jsonSchemaTypeToGraphQlType>
  = jsonSchemaTypeToGraphQlType;
const typesEntries: ReadonlyArray<Readonly<[string, string]>>
  = _.entries(types);
const propertiesTableColumns: ReadonlyArray<string>
  = ['name', 'type', 'required', 'remove'];
const initialObjectsTableRemoveColumnName = uuidv4(); // avoid name clashes
const intRegex = /^\d*$/;
const floatRegex = /^\d*\.?\d*$/;

export class RegexMatcher extends ErrorStateMatcher {

  constructor(private regex: RegExp) {
    super();
  }

  isErrorState(
    control?: FormControl | null,
    form?: FormGroupDirective | NgForm
  ): boolean {
    return control && (
      control.status === 'INVALID'
      || (
        control.value
        && !this.regex.test(control.value)
      )
    );
  }
}

@Component({
  templateUrl: './config-wizard.component.html',
  styleUrls: ['./config-wizard.component.css']
})
export class ConfigWizardComponent implements OnInit {
  // constants
  readonly types = typesEntries;
  readonly propertiesTableColumns = propertiesTableColumns;
  readonly initialObjectsTableRemoveColumnName =
    initialObjectsTableRemoveColumnName;
  readonly intMatcher = new RegexMatcher(intRegex);
  readonly floatMatcher = new RegexMatcher(floatRegex);

  // I/O
  /**
   * JSON string; initial config
   */
  @Input() readonly value: string;
  /**
   * JSON string, or null if configuration is not valid
   */
  @Output() readonly change = new BehaviorSubject<string>(null);

  // state
  readonly config: { schema: Schema, initialObjects: Object[] } = {
    schema: {
      properties: {},
      required: [],
      title: '',
      type: 'object'
    },
    initialObjects: []
  };
  newPropertyName: string;
  newPropertyType: propertyType;

  // dependent state
  properties: Property[] = [];

  /**
   * The columns of the initial objects table
   * All property names plus a column for the remove button
   */
  get initialObjectsTableColumns(): string[] {
    return [
      ...this.properties.map(this.columnName),
      initialObjectsTableRemoveColumnName
    ];
  }

  ngOnInit() {
    if (this.value) {
      Object.assign(this.config, JSON.parse(this.value));
      setTimeout(() => this.updatedProperties());
    }
  }

  /**
   * What the column in the initialObjects table for a property
   *   should be called / identified with
   * Angular actually cares that this changes when the property's
   *   required status changes
   */
  columnName = (property: Property): string => {
    const reqAnnot = property.required ? '*' : '';

    return `${property.name} (${property.type}) ${reqAnnot}`;
  }

  /**
   * Add a property, using the values the user inputted
   * Clears those values so they can input another
   */
  addProperty(): void {
    if (this.newPropertyName in this.config.schema.properties) {
      throw new Error('Attempted to add property with duplicate name.');
    }
    this.config.schema.properties[this.newPropertyName] = {
      type: this.newPropertyType
    };
    this.newPropertyName = '';
    this.newPropertyType = undefined;
    this.updatedProperties();
  }

  /**
   * If the property with the given name is not required, make it required.
   * If it is, make it optional.
   */
  toggleRequired(propertyName: string): void {
    const indexInRequired = this.config.schema.required.indexOf(propertyName);
    if (indexInRequired >= 0) {
      this.config.schema.required.splice(indexInRequired, 1);
    } else {
      this.config.schema.required.push(propertyName);
    }
    this.updatedProperties();
  }

  /**
   * Remove the property with the given name.
   */
  removeProperty(propertyName: string): void {
    delete this.config.schema.properties[propertyName];
    _.pull(this.config.schema.required, propertyName);
    if (_.size(this.config.schema.properties) === 0) {
      this.config.initialObjects = [];
    } else {
      this.config.initialObjects.forEach((initialObject) => {
        delete initialObject[propertyName];
      });
    }
    this.updatedProperties();
  }

  /**
   * Add an initial object
   * TODO: default values for required properties or validation
   */
  addInitialObject(): void {
    this.config.initialObjects = [...this.config.initialObjects, {}];
    this.postUpdateIfValid();
  }

  /**
   * Remove the given initialObject
   */
  removeInitialObject(object: Object): void {
    this.config.initialObjects = this.config.initialObjects
      .filter((o) => o !== object);
    this.postUpdateIfValid();
  }

  /**
   * Sends the config object if `isValid()` returns true
   * Sends null otherwise
   */
  postUpdateIfValid(): void {
    if (this.isValid()) {
      // since inputs store state as strings, we must parse number inputs
      const initialObjects = this.config.initialObjects.map((initialObject) => {
        const parsedInitialObject = {};
        _.forOwn(this.config.schema.properties, (prop, name) => {
          let value =  initialObject[name];
          if (!isGiven(value)) { return; }
          if (prop.type === 'integer' || prop.type === 'number') {
            value = parseFloat(value);
          }
          parsedInitialObject[name] = value;
        });

        return parsedInitialObject;
      });
      this.change.next(JSON.stringify(Object.assign(
        {}, this.config, { initialObjects }
      )));
    } else {
      this.change.next(null); // not valid
    }
  }

  /**
   * Update the properties table
   * when a property is added, deleted, or altered
   * also calls `postUpdateIfValid`
   */
  private updatedProperties(): void {
    const properties = [];
    const required = new Set(this.config.schema.required);
    _.forOwn(this.config.schema.properties, (prop, name) => {
      properties.push({
        name,
        type: types[prop.type],
        required: required.has(name)
      });
    });
    this.properties = properties;
    this.postUpdateIfValid();
  }

  /**
   * Whether or not the configurat ion is completed
   * This **is not** a checkRep. Constraints like
   *   "required contains only keys of properties"
   *   are enforced by the UI logic
   */
  private isValid(): boolean {
    const required = new Set(this.config.schema.required);

    return this.config.schema.title
      && _.size(this.config.schema.properties) > 0
      && this.config.initialObjects.every((initialObject) =>
        _.every(this.config.schema.properties, (prop, name) => {
          const value = initialObject[name];
          let given = isGiven(value);
          if (!given && required.has(name) && prop.type === 'boolean') {
            initialObject[name] = false;
            given = true;
          }
          if (!given) { return !required.has(name); }
          switch (prop.type) {
            case 'integer':
              return intRegex.test(value);
            case 'number': // float
              return floatRegex.test(value);
            default: // booleans and strings are always valid
              return true;
          }
        })
      );
  }
}
