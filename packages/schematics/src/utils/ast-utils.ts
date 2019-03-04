/**
 * Code taken from the utils of @schematics/angular
 * with some additions and modifications
 */

import * as ts from 'typescript';
import { Change, InsertChange, NoopChange } from './change';


/**
 * Append symbolName to the array assigned to the variable arrayName.
 * Does nothing if the araryName variable doesn't exist.
 * @param  source (the source file to modify and in which to look for arrayName)
 * @param  arrayName (the name of the array variable)
 * @param  symbolName (the symbol to add to the array)
 * @param  allowDuplicates (if false, does nothing if symbolName is already
 *                             in the array)
 * @return Change
 */
export function appendToArrayDeclaration(source: ts.SourceFile,
  arrayName: string, symbolName: string, allowDuplicates?: boolean): Change {
  const arrays = findNodes(source,
    ts.SyntaxKind.ArrayLiteralExpression) as ts.ArrayLiteralExpression[];

  for (let j = 0; j < arrays.length; j++) {
    const node = arrays[j];
    if (node.parent.kind !== ts.SyntaxKind.VariableDeclaration) {
      continue;
    }

    const children = node.parent.getChildren();
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.kind === ts.SyntaxKind.Identifier &&
        (child as ts.Identifier).escapedText === arrayName) {

        if (!allowDuplicates) {
          const matches = node.elements.filter((component: ts.Expression) => {
            return component.getText() === symbolName;
          });
          if (matches.length > 0) {
            return new NoopChange();
          }
        }

        // preserve trailing comma if it's there
        const toInsert = node.elements.hasTrailingComma ?
          ` ${symbolName},` : `, ${symbolName}`;

        return new InsertChange(source.fileName, node.elements.end, toInsert);
      }
    }
  }

  return new NoopChange();
}

/**
 * Add export { symbolName } to the source
 * @param source     (the source file to modify and in which to look for
 *                        existing exports and imports)
 * @param symbolName (the name to export)
 * @param fileName   (the file from which symbolName comes)
 * @param insertPos  (the position to insert the export statement.
 *                        If not provided, looks for the import declaration
 *                        of symbolName and inserts after the import position.
 *                        If there is no such import, falls back to the
 *                        beginning of the file.)
 * @return Change
 */
export function insertExport(source: ts.SourceFile, symbolName: string,
  fileName: string, insertPos?: number): Change {
  const rootNode = source;
  const allExports = findNodes(
    rootNode, ts.SyntaxKind.ExportDeclaration) as ts.ExportDeclaration[];

  for (let i = 0; i < allExports.length; i++) {
    const exportDeclaration = allExports[i];

    if (exportDeclaration.exportClause) {
      const exported = exportDeclaration.exportClause.elements;
      for (let j = 0; j < exported.length; j++) {
        if (exported[j].name.escapedText === symbolName) {
          return new NoopChange();
        }
      }
    } else {
      // this is the case of export * from fileName;
      // StringLiteral of the ExportDeclaration is the import file
      // (fileName in this case).
      const exportFiles = exportDeclaration.getChildren()
        .filter((child) => child.kind === ts.SyntaxKind.StringLiteral)
        .map((n) => (n as ts.StringLiteral).text);

      if (exportFiles.filter((file) => file === fileName).length === 1) {
        return new NoopChange();
      }
    }
  }

  // insert after the import of symbolName if insertPos is not given
  if (insertPos === undefined) {
    const importNode = findImportNode(source, symbolName, fileName);
    // fall back to start of the file if symbolName is not imported
    insertPos = importNode ? importNode.getEnd() + 1 : 0;
  }

  const startSeparator = insertPos === 0 ? '' : '\n';
  const endSeparator = insertPos === 0 ? '\n' : '';

  return new InsertChange(
    source.fileName, insertPos,
    `${startSeparator}export { ${symbolName} };${endSeparator}`);
}

/**
 * @return the Node that imports symbolName from filePath if it exists
 */
function findImportNode(source: ts.SourceFile,
  symbolName: string, filePath: string): ts.Node | undefined {
  const allNodes = getSourceNodes(source);
  const matchingNodes = allNodes
    .filter((node) => node.kind === ts.SyntaxKind.ImportDeclaration)
    .filter((imp: ts.ImportDeclaration) =>
      imp.moduleSpecifier.kind === ts.SyntaxKind.StringLiteral)
    .filter((imp: ts.ImportDeclaration) => {
      return (imp.moduleSpecifier as ts.StringLiteral).text === filePath;
    })
    .filter((imp: ts.ImportDeclaration) => {
      if (!imp.importClause) {
        return false;
      }
      const nodes = findNodes(imp.importClause, ts.SyntaxKind.ImportSpecifier)
        .filter((n) => n.getText() === symbolName);

      return nodes.length > 0;
    });

  return matchingNodes.length > 0 ? matchingNodes[0] : undefined;
}


/**
 * Add Import `import { symbolName } from fileName` if the import doesn't exist
 * already. Assumes fileToEdit can be resolved and accessed.
 * @param fileToEdit (file we want to add import to)
 * @param symbolName (item to import)
 * @param fileName (path to the file)
 * @param insertPos (the position to insert the import if there is no import
 *                       of symbolName or no imports from fileName yet)
 * @param isDefault (if true,
 *                      import follows style for importing default exports)
 * @return Change
 */
export function insertImport(source: ts.SourceFile, fileToEdit: string,
                             symbolName: string, fileName: string,
                             insertPos: number, isDefault = false): Change {
  const rootNode = source;
  const allImports = findNodes(rootNode, ts.SyntaxKind.ImportDeclaration);

  // get nodes that map to import statements from the file fileName
  const relevantImports = allImports.filter((node) => {
    // StringLiteral of the ImportDeclaration is the import file
    // (fileName in this case).
    const importFiles = node.getChildren()
      .filter((child) => child.kind === ts.SyntaxKind.StringLiteral)
      .map((n) => (n as ts.StringLiteral).text);

    return importFiles.filter((file) => file === fileName).length === 1;
  });

  if (relevantImports.length > 0) {
    let importsAsterisk = false;
    // imports from import file
    const imports: ts.Node[] = [];
    relevantImports.forEach((n) => {
      Array.prototype.push.apply(
        imports, findNodes(n, ts.SyntaxKind.Identifier));
      if (findNodes(n, ts.SyntaxKind.AsteriskToken).length > 0) {
        importsAsterisk = true;
      }
    });

    // if imports * from fileName, don't add symbolName
    if (importsAsterisk) {
      return new NoopChange();
    }

    const importTextNodes = imports.filter((n) =>
      (n as ts.Identifier).text === symbolName);

    // insert import if it's not there
    if (importTextNodes.length === 0) {
      const fallbackPos =
        findNodes(relevantImports[0], ts.SyntaxKind.CloseBraceToken)[0]
          .getStart() ||
        findNodes(relevantImports[0], ts.SyntaxKind.FromKeyword)[0]
          .getStart();

      return insertAfterLastOccurrence(
        imports, `, ${symbolName}`, fileToEdit, fallbackPos);
    }

    return new NoopChange();
  }

  // no such import declaration exists
  const open = isDefault ? '' : '{ ';
  const close = isDefault ? '' : ' }';
  const startSeparator = insertPos === 0 ? '' : '\n';
  const endSeparator = insertPos === 0 ? '\n' : '';
  const toInsert = `${startSeparator}import ${open}${symbolName}${close}` +
    ` from '${fileName}';${endSeparator}`;

  return new InsertChange(source.fileName, insertPos, toInsert);
}


/**
 * Find all nodes from the AST in the subtree of node of SyntaxKind kind.
 * @param node
 * @param kind
 * @param max The maximum number of items to return.
 * @return all nodes of kind, or [] if none is found
 */
export function findNodes(
  node: ts.Node, kind: ts.SyntaxKind, max = Infinity): ts.Node[] {
  if (!node || max === 0) {
    return [];
  }

  const arr: ts.Node[] = [];
  if (node.kind === kind) {
    arr.push(node);
    max--;
  }
  if (max > 0) {
    for (const child of node.getChildren()) {
      findNodes(child, kind, max)
        .forEach((subnode) => {
          if (max > 0) {
            arr.push(subnode);
          }
          max--;
        });

      if (max <= 0) {
        break;
      }
    }
  }

  return arr;
}


/**
 * Get all the nodes from a source.
 * @param sourceFile The source file object.
 * @returns {Observable<ts.Node>} An observable of all the nodes in the source.
 */
export function getSourceNodes(sourceFile: ts.SourceFile): ts.Node[] {
  const nodes: ts.Node[] = [sourceFile];
  const result = [];

  while (nodes.length > 0) {
    const node = nodes.shift();

    if (node) {
      result.push(node);
      if (node.getChildCount(sourceFile) >= 0) {
        nodes.unshift(...node.getChildren());
      }
    }
  }

  return result;
}

export function findNode(
  node: ts.Node, kind: ts.SyntaxKind, text: string): ts.Node | null {
  if (node.kind === kind && node.getText() === text) {
    // throw new Error(node.getText());
    return node;
  }

  let foundNode: ts.Node | null = null;
  ts.forEachChild(node, (childNode) => {
    foundNode = foundNode || findNode(childNode, kind, text);
  });

  return foundNode;
}


/**
 * Helper for sorting nodes.
 * @return function to sort nodes in increasing order of position in sourceFile
 */
export function nodesByPosition(first: ts.Node, second: ts.Node): number {
  return first.getStart() - second.getStart();
}


/**
 * Insert `toInsert` after the last occurence of `ts.SyntaxKind[nodes[i].kind]`
 * or after the last of occurence of `syntaxKind`
 * if the last occurence is a sub child
 * of ts.SyntaxKind[nodes[i].kind] and save the changes in file.
 *
 * @param nodes insert after the last occurence of nodes
 * @param toInsert string to insert
 * @param file file to insert changes into
 * @param fallbackPos position to insert
 *                             if toInsert happens to be the first occurence
 * @param syntaxKind the ts.SyntaxKind of the subchildren to insert after
 * @return Change instance
 * @throw Error if toInsert is first occurence but fall back is not set
 */
export function insertAfterLastOccurrence(nodes: ts.Node[],
                                          toInsert: string,
                                          file: string,
                                          fallbackPos: number,
                                          syntaxKind?: ts.SyntaxKind): Change {
  // sort() has a side effect, so make a copy so that
  // we won't overwrite the parent's object.
  let lastItem = [...nodes]
    .sort(nodesByPosition)
    .pop();
  if (!lastItem) {
    throw new Error();
  }
  if (syntaxKind) {
    lastItem = findNodes(lastItem, syntaxKind)
      .sort(nodesByPosition)
      .pop();
  }
  if (!lastItem && fallbackPos === undefined) {
    throw new Error(`tried to insert ${toInsert} ` +
      'as first occurence with no fallback position');
  }
  const lastItemPosition: number = lastItem ? lastItem.getEnd() : fallbackPos;

  return new InsertChange(file, lastItemPosition, toInsert);
}


export function getContentOfKeyLiteral(
  _source: ts.SourceFile, node: ts.Node): string | null {
  if (node.kind === ts.SyntaxKind.Identifier) {
    return (node as ts.Identifier).text;
  } else if (node.kind === ts.SyntaxKind.StringLiteral) {
    return (node as ts.StringLiteral).text;
  } else {
    return null;
  }
}
