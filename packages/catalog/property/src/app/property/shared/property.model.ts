export enum GraphQlType {
  Int = 'Int',
  Float = 'Float',
  String = 'String',
  Boolean = 'Boolean'
}

export interface Property {
  name: string;
  required: boolean;
  schema: any;
  graphQlType: GraphQlType;
}
