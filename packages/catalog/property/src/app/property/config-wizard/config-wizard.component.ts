import { Component, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as uuidv4 from 'uuid/v4';
import {
  jsonSchemaTypeToGraphQlType,
  Schema
} from '../../../../server/config-types';

export interface Config {
  schema: Schema;
  initialObjects: Object[];
}
export type propertyType = keyof typeof jsonSchemaTypeToGraphQlType;
interface Property {
  name: string;
  type: string;
  required: boolean;
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

class RegexMatcher extends ErrorStateMatcher {

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
  selector: 'property-config-wizard',
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
   * The name the cliche is being *instantiated* with
   * (Obviously the cliche is named property)
   */
  @Input() readonly clicheName: string;
  /**
   * Object that should be included in the dvconfig
   * Null is the initial value because the state starts invalid
   */
  @Output() readonly change = new BehaviorSubject<Config>(null);

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

  ngOnInit(): void {
    this.config.schema.title = this.clicheName;
  }

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

  /**
   * Remove the property with the given name.
   */
  removeProperty(propertyName: string): void {
    delete this.config.schema.properties[propertyName];
    _.pull(this.config.schema.required, propertyName);
    this.updatedProperties();
  }

  /**
   * Remove the given initialObject
   */
  removeInitialObject(object: Object): void {
    this.config.initialObjects = this.config.initialObjects
      .filter((o) => o !== object);
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
   * Add an initial object
   * TODO: default values for required properties or validation
   */
  addInitialObject(): void {
    this.config.initialObjects = [...this.config.initialObjects, {}];
  }

  /**
   * Sends the config object if `isValid()` returns true
   * Sends null otherwise
   */
  postUpdateIfValid(): void {
    console.log(this.config);
    if (this.isValid()) {
      this.change.next(this.config);
    } else {
      this.change.next(null); // not valid
    }
  }

  columnName = (property: Property): string => {
    const reqAnnot = property.required ? '*' : '';

    return `${property.name} (${property.type}) ${reqAnnot}`;
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
    // force a table refresh
    // const { initialObjects } = this.config;
    // this.config.initialObjects = [];
    // setTimeout(() => this.config.initialObjects = initialObjects);
    this.postUpdateIfValid();
  }

  /**
   * Whether or not the configuration is completed
   * This **is not** a checkRep. Constraints like
   *   "required contains only keys of properties"
   *   are enforced by the UI logic
   */
  private isValid(): boolean {
    return !!this.config.schema.title;
  }
}
