import { strings } from '@angular-devkit/core';
import {
  apply,
  filter,
  mergeWith,
  Rule,
  SchematicContext,
  template,
  Tree,
  url
} from '@angular-devkit/schematics';


export function cliche(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const templateSource = apply(url('./files'), [
      filter((path) => !path.endsWith('.DS_Store')),
      template({
        ...strings,
        ...options
      })
    ]);

    return mergeWith(templateSource)(tree, context);
  };
}
