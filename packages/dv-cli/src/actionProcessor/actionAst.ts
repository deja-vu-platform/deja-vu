import * as posthtml from 'posthtml';

import * as _ from 'lodash';


export type ActionAst = ActionTag[];
export interface ActionTag {
  fqtag: string;
  dvOf?: string;
  dvAlias?: string;
  tag: string;
  inputs?: {[name: string]: string};
  content?: ActionAst;
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


export function getActionAst(
  projectName: string, actionName: string, usedCliches: ReadonlyArray<string>,
  html: string): ActionAst {
  const tagsToKeep = new Set([ projectName, ...usedCliches, 'dv' ]);
  const shouldKeep = (tag: Tag): boolean =>  {
    return tagsToKeep.has(tag.tag.split('-')[0]) || tag.tag === 'router-outlet';
  };
  return posthtml([
      pruneSubtreesWithNoActions(shouldKeep),
      removeNonActions(shouldKeep),
      buildActionAst(),
      checkForErrors(actionName)
    ])
    .process(html, { sync: true })
    .tree;
}

/**
 *  Retain only elements s.t `shouldKeep(tag)` is true and its ancestors.
 *
 *  The goal of this pass is to prune the AST, cutting the branches that
 *  include no actions.
 */
function pruneSubtreesWithNoActions(shouldKeep: (tag: Tag) => boolean) {
  const _pruneSubtreesWithNoActions = (tree: PostHtmlAst): TagOnlyAst => {
    const ret: TagOnlyAst = _.chain<PostHtmlAst>(tree)
      .map((tag: string | Tag): TagOnly | null => {
        if (_.isString(tag)) {
          return null;
        }
        if (shouldKeep(tag)) {
          tag.content = _pruneSubtreesWithNoActions(tag.content);
          // We can't filter attrs to only include those that are not html
          // global attributes because the action could use what would be valid
          // html global attributes as inputs (e.g., `<foo [id]="bar"></foo>`)
        } else {
          tag.attrs = {};
          tag.content = _pruneSubtreesWithNoActions(tag.content);
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
  return _pruneSubtreesWithNoActions;
}

/**
 *  Replace non-action elements with its children
 */
function removeNonActions(shouldKeep: (tag: Tag) => boolean) {
  // The given AST will have actions and its ancestors (which could be actions
  // or not). In this phase, we remove the non actions. Note that the leafs
  // of the tree are always actions.
  const _removeNonActions = (tree: TagOnlyAst): TagOnlyAst => {
    return _
      .chain(tree)
      .map((tag: TagOnly) => {
        if (shouldKeep(tag)) {
          tag.content = _removeNonActions(tag.content);
          return [tag];
        } else {
          return _removeNonActions(tag.content);
        }
      })
      .flatten()
      .value();
  };
  return _removeNonActions;
}

/**
 * Turn a `PostHtmlAst` consisting only of actions into an `ActionAst`
 * (i.e., enhance the AST with action-specific information)
 */
function buildActionAst() {
  const _buildActionAst = (tree: TagOnlyAst): ActionAst => {
    const ret: ActionTag[] = _.map(tree, (tag: TagOnly): ActionTag => {
      const dvOf = _.get(tag.attrs, 'dvOf');
      const dvAlias = _.get(tag.attrs, 'dvAlias');
      const actionTag: ActionTag = {
        fqtag: getFqTag(tag.tag, dvOf, dvAlias),
        dvOf: dvOf, dvAlias: dvAlias, tag: tag.tag,
        inputs: tag.attrs, content: _buildActionAst(tag.content)
      };

      return _.omitBy(actionTag, _.isEmpty) as ActionTag;
    });

    return ret;
  };

  return _buildActionAst;
}


/**
 * Check for errors in the tree. The following are considered errors:
 *   - having the same (request-sending) action as a child more than once
 *   - having sibling dv-tx nodes with the same child (request-sending) action
 *
 * These are errors because at runtime we can't tell apart the requests from
 * these actions with the same path and we need to be able to tell them apart
 * because they are part of a tx.
 */
function checkForErrors(actionName: string) {
  const getRepeatedFqTags = (actionAst: ActionAst) => _.pickBy(
    _.groupBy(actionAst, 'fqtag'),
    (actions: ActionTag[], fqtag: string) => {
      // TODO: filter non-request sending cliche actions
      if (fqtag !== 'dv-tx' && fqtag.startsWith('dv')) {
        return false;
      }
      return actions.length > 1;
    });
  const _checkForErrors = (path: string, fqtag: string) =>
    (tree: ActionAst): ActionAst => {
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
      _.each(tree, (actionTag: ActionTag): void => {
        _checkForErrors(currPath, actionTag.fqtag)(actionTag.content);
      });

      return tree;
    };

  return _checkForErrors('', actionName);
}

/**
 *  @returns the fully-qualified tag for the given tag. The fully-qualified tag
 *           of an action is its `dvAlias` if one is given, `dvOf-actionName`
 *           if a `dvOf` is given or `tag` if otherwise
 */
function getFqTag(
  tag: string, dvOf: string | undefined, dvAlias: string | undefined): string {
  if (dvAlias) {
    return dvAlias;
  }
  let [clicheName, ...actionTagName] = tag.split('-');
  if (dvOf) { clicheName = dvOf; }

  return clicheName + '-' + actionTagName.join('-');
}
