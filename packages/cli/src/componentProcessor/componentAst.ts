import * as posthtml from 'posthtml';

import * as _ from 'lodash';


export type ComponentAst = ComponentTag[];
export interface ComponentTag {
  fqtag: string;
  dvOf?: string;
  dvAlias?: string;
  tag: string;
  inputs?: {[name: string]: string};
  content?: ComponentAst;
}

interface TagInfo {
  tag: string;
  attrs?: { [key: string]: string }; // a boolean attr has '' as its value
}

// https://github.com/posthtml/posthtml-parser
// strings represent plain text content to be written to the output
type PostHtmlAst = (string | Tag)[];
interface Tag extends TagInfo {
  content: PostHtmlAst;
}

type TagOnlyAst = TagOnly[];
interface TagOnly extends TagInfo {
  content: TagOnlyAst;
}


export function getComponentAst(
  projectName: string, componentName: string, usedConcepts: ReadonlyArray<string>,
  html: string): ComponentAst {
  const tagsToKeep = new Set([ projectName, ...usedConcepts, 'dv' ]);
  const shouldKeep = (tag: Tag): boolean =>  {
    return tagsToKeep.has(tag.tag.split('-')[0]) || tag.tag === 'router-outlet';
  };

  return posthtml([
      pruneSubtreesWithNoComponents(shouldKeep),
      removeNonComponents(shouldKeep),
      buildComponentAst(),
      checkForErrors(componentName)
    ])
    .process(html, { sync: true })
    .tree;
}

/**
 *  Retain only elements s.t `shouldKeep(tag)` is true and its ancestors.
 *
 *  The goal of this pass is to prune the AST, cutting the branches that
 *  include no components.
 */
function pruneSubtreesWithNoComponents(shouldKeep: (tag: Tag) => boolean) {
  const _pruneSubtreesWithNoComponents = (tree: PostHtmlAst): TagOnlyAst => {
    const ret: TagOnlyAst = _.chain<PostHtmlAst>(tree)
      .map((tag: string | Tag): TagOnly | null => {
        if (_.isString(tag)) {
          return null;
        }
        if (shouldKeep(tag)) {
          tag.content = _pruneSubtreesWithNoComponents(tag.content);
          // We can't filter attrs to only include those that are not html
          // global attributes because the component could use what would be valid
          // html global attributes as inputs (e.g., `<foo [id]="bar"></foo>`)
        } else {
          tag.attrs = {};
          tag.content = _pruneSubtreesWithNoComponents(tag.content);
          if (_.isEmpty(tag.content)) {
            return null;
          }
        }

        return tag as TagOnly;
      })
      .reject(_.isNull)
      .value();

    return ret;
  };

  return _pruneSubtreesWithNoComponents;
}

/**
 *  Replace non-component elements with its children
 */
function removeNonComponents(shouldKeep: (tag: Tag) => boolean) {
  // The given AST will have components and its ancestors (which could be components
  // or not). In this phase, we remove the non components. Note that the leafs
  // of the tree are always components.
  const _removeNonComponents = (tree: TagOnlyAst): TagOnlyAst => {
    return _
      .chain(tree)
      .map((tag: TagOnly) => {
        if (shouldKeep(tag)) {
          tag.content = _removeNonComponents(tag.content);

          return [tag];
        } else {
          return _removeNonComponents(tag.content);
        }
      })
      .flatten()
      .value();
  };

  return _removeNonComponents;
}

/**
 * Turn a `PostHtmlAst` consisting only of components into an `ComponentAst`
 * (i.e., enhance the AST with component-specific information)
 */
function buildComponentAst() {
  const _buildComponentAst = (tree: TagOnlyAst): ComponentAst => {
    const ret: ComponentTag[] = _.map(tree, (tag: TagOnly): ComponentTag => {
      const dvOf = _.get(tag.attrs, 'dvOf');
      const dvAlias = _.get(tag.attrs, 'dvAlias');
      const componentTag: ComponentTag = {
        fqtag: getFqTag(tag.tag, dvOf, dvAlias),
        dvOf: dvOf, dvAlias: dvAlias, tag: tag.tag,
        inputs: tag.attrs, content: _buildComponentAst(tag.content)
      };

      return _.omitBy(componentTag, _.isEmpty) as ComponentTag;
    });

    return ret;
  };

  return _buildComponentAst;
}


/**
 * Check for errors in the tree. The following are considered errors:
 *   - having the same (request-sending) component as a child more than once
 *   - having sibling dv-tx nodes with the same child (request-sending) component
 *
 * These are errors because at runtime we can't tell apart the requests from
 * these components with the same path and we need to be able to tell them apart
 * because they are part of a tx.
 */
function checkForErrors(componentName: string) {
  const getRepeatedFqTags = (componentAst: ComponentAst) => _.pickBy(
    _.groupBy(componentAst, 'fqtag'),
    (components: ComponentTag[], fqtag: string) => {
      // TODO: filter non-request sending concept components
      if (fqtag !== 'dv-tx' && fqtag.startsWith('dv')) {
        return false;
      }

      return components.length > 1;
    });
  const _checkForErrors = (path: string, fqtag: string) =>
    (tree: ComponentAst): ComponentAst => {
      const currPath = path + ' -> ' + fqtag;
      const repeatedFqTags = getRepeatedFqTags(tree);
      if (!_.isEmpty(repeatedFqTags) && fqtag === 'dv-tx') {
        throw new Error(`
          More than one element with the same fqtag inside a dv-tx
          solution: use aliasing (the dvAlias attribute)
          path: ${currPath}
          repeated fqtag: ${_.keys(repeatedFqTags)}
        `);
      }
      const repeatedDvTxTags = repeatedFqTags['dv-tx'];
      if (!_.isEmpty(repeatedDvTxTags)) {
        const repeatedDvTxChildren = getRepeatedFqTags(
          _.flatMap(repeatedDvTxTags, 'content'));
        if (!_.isEmpty(repeatedDvTxChildren)) {
          throw new Error(`
            More than one element with the same fqtag inside sibling dv-tx nodes
            solution: use aliasing (the dvAlias attribute)
            path: ${currPath}
            repeated fqtags: ${_.keys(repeatedDvTxChildren)}
          `);
        }
      }
      _.each(tree, (componentTag: ComponentTag): void => {
        if (componentTag.content !== undefined) {
          _checkForErrors(currPath, componentTag.fqtag)(componentTag.content);
        }
      });

      return tree;
    };

  return _checkForErrors('', componentName);
}

/**
 *  @returns the fully-qualified tag for the given tag. The fully-qualified tag
 *           of a component is its `dvAlias` if one is given, `dvOf-componentName`
 *           if a `dvOf` is given or `tag` if otherwise
 */
function getFqTag(
  tag: string, dvOf: string | undefined, dvAlias: string | undefined): string {
  if (dvAlias) {
    return dvAlias;
  }
  // tslint:disable-next-line prefer-const
  let [conceptName, ...componentTagName] = tag.split('-');
  if (dvOf) { conceptName = dvOf; }

  return conceptName + '-' + componentTagName.join('-');
}
