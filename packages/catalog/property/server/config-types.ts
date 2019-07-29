import { Config } from '@deja-vu/cliche-server';

export const jsonSchemaTypeToGraphQlType = {
  integer: 'Int',
  number: 'Float',
  string: 'String',
  boolean: 'Boolean'
  /* Not supported yet: object, array, null */
};

export const jsonSchemaTypeToGraphQlFilterType = {
  boolean: 'Boolean',
  integer: 'RangeFilterInput',
  number: 'RangeFilterInput'
  /* string is not supported */
};

export const jsonSchemaTypedEnumFilterToGraphQlFilter = {
  boolean: 'BooleanEnumFilterInput',
  integer: 'IntegerEnumFilterInput',
  number: 'NumberEnumFilterInput',
  string: 'StringEnumFilterInput'
};

export interface Property {
  type: keyof typeof jsonSchemaTypeToGraphQlType;
  enum?: any[];
}

export interface Schema {
  properties: { [name: string]: Property };
  required?: string[];
  title: string;
  type: 'object';
}

export interface PropertyConfig extends Config {
  initialObjects: Object[];
  schema: Schema;
}
