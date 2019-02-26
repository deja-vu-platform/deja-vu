import { InputValuesMap, TxInputsValidator } from '../src/txInputsValidator';


describe('TxInputsValidator', () => {
  it('should validate', () => {
    const inputValuesMap: InputValuesMap = {
      'authentication-authenticate': {
        id: 'ben'
      },
      'property-create-object': {
        id: 'new-post-id'
      },
      'scoringposts-create-score': {
        sourceId: 'ben',
        targetId: 'new-post-id',
        value: 0
      }
    };
    const txActions = [
      {
        fqtag: 'authentication-authenticate', tag: '', inputs: {
          id: '__ngOutput__hackernews__navbar__loggedInUser.id'
        }
      },
      {
        fqtag: 'property-create-object', tag: '', inputs: {
          '[id]': '__ngOutput__dv__gen_id__id',
          '[initialValue]':
            '{author: __ngOutput__hackernews__navbar__loggedInUser.username}',
          '[newObjectSavedText]': '"Post submitted"',
          '[showOptionToSubmit]': '__ngOutput__hackernews__navbar__loggedInUser'
        }
      },
      {
        fqtag: 'scoringposts-create-score', tag: '', inputs: {
          '[sourceId]': '__ngOutput__hackernews__navbar__loggedInUser.id',
          '[targetId]': '__ngOutput__dv__gen_id__id',
          '[value]': '0'
        }
      },
      {
        fqtag: 'dv-link', tag: '', inputs: {
          '[href]': '"/item"',
          '[params]': '{id: __ngOutput__dv__gen_id__id}',
          '[hidden]': 'true'
        }
      }
    ];
    const context = {
      __ngOutput__hackernews__navbar__loggedInUser: {
        id: 'ben', username: 'ben'
      },
      __ngOutput__dv__gen_id__id: 'new-post-id'
    };
    TxInputsValidator.Validate(inputValuesMap, txActions, context);
  });

  it('should fail on invalid value for literal', () => {
    const inputValuesMap: InputValuesMap = {
      'scoringposts-create-score': {
        sourceId: 'ben',
        targetId: 'new-post-id',
        value: 10
      }
    };
    const txActions = [
      {
        fqtag: 'scoringposts-create-score', tag: '', inputs: {
          '[sourceId]': '__ngOutput__hackernews__navbar__loggedInUser.id',
          '[targetId]': '__ngOutput__dv__gen_id__id',
          '[value]': '0'
        }
      }
    ];
    const context = {
      __ngOutput__hackernews__navbar__loggedInUser: {
        id: 'ben', username: 'ben'
      },
      __ngOutput__dv__gen_id__id: 'new-post-id'
    };
    expect(() => TxInputsValidator.Validate(inputValuesMap, txActions, context))
      .toThrow();
  });

  it('should fail on unmatched values', () => {
    const inputValuesMap: InputValuesMap = {
      'scoringposts-create-score': {
        targetId: 'new-post-id'
      },
      'property-create-object': {
        id: 'other-id'
      }
    };
    const txActions = [
      {
        fqtag: 'property-create-object', tag: '', inputs: {
          '[id]': '__ngOutput__dv__gen_id__id'
        }
      },
      {
        fqtag: 'scoringposts-create-score', tag: '', inputs: {
          '[targetId]': '__ngOutput__dv__gen_id__id'
        }
      },
    ];
    const context = {
      __ngOutput__dv__gen_id__id: 'new-post-id'
    };
    expect(() => TxInputsValidator.Validate(inputValuesMap, txActions, context))
      .toThrow();
  });
});
