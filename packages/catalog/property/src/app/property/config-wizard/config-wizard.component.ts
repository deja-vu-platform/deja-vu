import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as _ from 'lodash';
import {
  jsonSchemaTypeToGraphQlType,
  Schema
} from '../../../../server/config-types';

export interface Config {
  schema: Schema;
  initalObjects: Object[];
}
export type propertyType = keyof typeof jsonSchemaTypeToGraphQlType;

const types: Readonly<typeof jsonSchemaTypeToGraphQlType>
  = jsonSchemaTypeToGraphQlType;
const typesEntries: ReadonlyArray<Readonly<[string, string]>>
  = _.entries(types);
const displayedColumns: ReadonlyArray<string>
  = ['name', 'type', 'required', 'remove'];

@Component({
  selector: 'property-config-wizard',
  templateUrl: './config-wizard.component.html',
  styleUrls: ['./config-wizard.component.css']
})
export class ConfigWizardComponent implements OnInit {
  // constants
  readonly types = typesEntries;
  readonly displayedColumns = displayedColumns;

  // I/O
  /**
   * The name the cliche is being *instantiated* with
   * (Obviously the cliche is named property)
   */
  @Input() readonly clicheName: string;
  /**
   * Object that should be included in the dvconfig
   */
  @Output() readonly change = new EventEmitter<Config>();

  // state
  readonly config: { schema: Schema, initalObjects: Object[] } = {
    schema: {
      properties: {},
      required: [],
      title: '',
      type: 'object'
    },
    initalObjects: []
  };
  newPropertyName: string;
  newPropertyType: propertyType;

  // dependent state
  properties: { name: string, type: string, required: boolean }[] = [];

  ngOnInit(): void {
    this.config.schema.title = this.clicheName;
  }

  /**
   * Remove the property with the given name.
   */
  remove(propertyName: string): void {
    delete this.config.schema.properties[propertyName];
    _.pull(this.config.schema.required, propertyName);
    this.updateTableData();
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
    this.updateTableData();
  }

  /**
   * Add a property, using the values the user inputted
   * Clears those values so they can input another
   */
  add(): void {
    if (this.newPropertyName in this.config.schema.properties) {
      throw new Error('Attempted to add property with duplicate name.');
    }
    this.config.schema.properties[this.newPropertyName] = {
      type: this.newPropertyType
    };
    this.newPropertyName = '';
    this.newPropertyType = undefined;
    this.updateTableData();
  }

  /**
   * Sends the config object if `isValid()` returns true
   * Sends null otherwise
   */
  postUpdateIfValid(): void {
    if (this.isValid()) {
      this.change.emit(this.config);
      console.log('emit', this.config);
    } else {
      this.change.emit(null); // not valid
      console.log('emit', null);
    }
  }

  /**
   * Update the properties table
   * when a property is added, deleted, or altered
   * also calls `postUpdateIfValid`
   */
  private updateTableData(): void {
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
   * Whether or not the configuration is completed
   * This **is not** a checkRep. Constraints like
   *   "required contains only keys of properties"
   *   are enforced by the UI logic
   */
  private isValid(): boolean {
    return !!this.config.schema.title;
  }
}
