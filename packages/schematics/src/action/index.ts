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


export function action(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const templateSource = apply(url('./files'), [
        template({
          ...strings,
          ...options,
        }),
        filter((path) => !path.endsWith('.DS_Store') && !tree.exists(path)),
    ]);

    return mergeWith(templateSource)(tree, _context);
  };
}
