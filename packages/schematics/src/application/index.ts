import { strings } from '@angular-devkit/core';
import {
  apply,
  Rule,
  SchematicContext,
  Tree,
  template,
  mergeWith,
  filter,
  url
} from '@angular-devkit/schematics';


export function cliche(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const templateSource = apply(url('./files'), [
      filter((path) => !path.endsWith('.DS_Store')),
      template({
        ...strings,
        ...options
      }),
    ]);

    return mergeWith(templateSource)(tree, context);
  };
}
