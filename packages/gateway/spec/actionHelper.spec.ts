import { ActionHelper , ActionTable } from '../src/actionHelper';
import { ActionPath } from '../src/actionPath';

describe('ActionHelper', () => {
  it('should require alias for duplicate paths', () => {
    const actionTable: ActionTable = {
      'chorestar-root': [
        {
          fqtag: 'router-outlet',
          tag: 'router-outlet'
        }
      ],
      'chorestar-parent-home': [
        {
          fqtag: 'task-show-tasks',
          tag: 'task-show-tasks',
          inputs: {
            '[assignerId]': 'user?.id',
            '[completed]': 'false',
            '[showTask]': `{
              type: showChore,
              tag: 'chorestar-show-chore',
              inputMap: { task: 'chore' }
            }`,
            noTasksToShowText: 'No assigned chores'
          }
        },
        {
          fqtag: 'task-show-tasks',
          tag: 'task-show-tasks',
          inputs: {
            '[approved]': 'false',
            '[completed]': 'true',
            '[assignerId]': 'user?.id',
            '[showTask]': `{
              type: showChore,
              tag: 'chorestar-show-chore',
              inputMap: {task: 'chore'},
              inputs: {showOptionToApprove: true}
            }`,
            noTasksToShowText: 'No chores to approve'
          }
        },
        {
          fqtag: 'reward-show-objects',
          dvOf: 'reward',
          tag: 'property-show-objects',
          inputs: {
            dvOf: 'reward',
            '[showOnly]': '["name", "cost"]'
          }
        },
        {
          fqtag: 'dv-tx',
          tag: 'dv-tx',
          inputs: {
            class: 'white-box right-box col-md-5'
          },
          content: [
            {
              fqtag: 'dv-gen-id',
              tag: 'dv-gen-id',
              inputs: {
                '(id)': 'rewardId=$event'
              }
            },
            {
              fqtag: 'dv-status',
              tag: 'dv-status',
              inputs: {
                savedText: 'Reward created'
              }
            },
            {
              fqtag: 'reward-create-object',
              dvOf: 'reward',
              tag: 'property-create-object',
              inputs: {
                dvOf: 'reward',
                '[id]': 'rewardId',
                '[showOptionToSubmit]': 'false'
              }
            },
            {
              fqtag: 'dv-button',
              tag: 'dv-button'
            }
          ]
        },
        {
          fqtag: 'dv-tx',
          tag: 'dv-tx',
          inputs: {
            class: 'white-box offset-md-1 col-md-5'
          },
          content: [
            {
              fqtag: 'dv-gen-id',
              tag: 'dv-gen-id',
              inputs: {
                '(id)': 'childId=$event'
              }
            },
            {
              fqtag: 'dv-status',
              tag: 'dv-status',
              inputs: {
                savedText: 'Child created'
              }
            },
            {
              fqtag: 'child-create-object',
              dvOf: 'child',
              tag: 'property-create-object',
              inputs: {
                dvOf: 'child',
                '[id]': 'childId',
                '[showOptionToSubmit]': 'false'
              }
            },
            {
              fqtag: 'childauthentication-register-user',
              dvOf: 'childauthentication',
              tag: 'authentication-register-user',
              inputs: {
                dvOf: 'childauthentication',
                '[id]': 'childId',
                '[signIn]': 'false',
                '[showOptionToSubmit]': 'false'
              }
            },
            {
              fqtag: 'group-add-to-group',
              tag: 'group-add-to-group',
              inputs: {
                '[id]': 'user?.id',
                '[memberId]': 'childId',
                '[hidden]': 'true'
              }
            },
            {
              fqtag: 'dv-button',
              tag: 'dv-button'
            }
          ]
        }
      ],
      'chorestar-show-chore': [
        {
          fqtag: 'chore-show-object',
          dvOf: 'chore',
          tag: 'property-show-object',
          inputs: {
            dvOf: 'chore',
            '[id]': 'chore.id',
            '[showOnly]': '["name"]'
          }
        },
        {
          fqtag: 'task-show-task',
          tag: 'task-show-task',
          inputs: {
            '[task]': 'chore',
            '[showId]': 'false',
            '[showAssigner]': 'false',
            '[showAssignee]': 'false',
            '[showCompleted]': 'false',
            '[showApproved]': 'false'
          }
        },
        {
          fqtag: 'childauthentication-show-user',
          dvOf: 'childauthentication',
          tag: 'authentication-show-user',
          inputs: {
            dvOf: 'childauthentication',
            '[id]': 'chore.assigneeId'
          }
        },
        {
          fqtag: 'dv-tx',
          tag: 'dv-tx',
          inputs: {
            class: 'offset-md-4 col-md-4'
          },
          content: [
            {
              fqtag: 'transfer-add-to-balance',
              tag: 'transfer-add-to-balance',
              inputs: {
                '[showOptionToInputAccountId]': 'false',
                '[showOptionToInputBalance]': 'false',
                '[showOptionToSubmit]': 'false',
                '[accountId]': 'chore.assigneeId',
                '[amount]': '1',
                newTransferSavedText: 'Chore completion approved.'
              }
            },
            {
              fqtag: 'task-approve-task',
              tag: 'task-approve-task',
              inputs: {
                '[id]': 'chore.id',
                '[hidden]': 'true'
              }
            },
            {
              fqtag: 'dv-button',
              tag: 'dv-button'
            }
          ]
        }
      ],
    };
    const usedCliches = [
      'authentication',
      'authorization',
      'authentication',
      'authorization',
      'transfer',
      'task',
      'group',
      'property',
      'property',
      'property'
    ];
    const routes = [
      {
        path: 'parent',
        action: 'chorestar-parent-home'
      }
    ];
    const actionHelper = new ActionHelper(usedCliches, actionTable, routes);

    const arrayActionPath = [
      'chorestar-root',
      'chorestar-parent-home',
      'task-show-tasks',
      'dv-include',
      'chorestar-show-chore',
      'dv-tx',
      'task-approve-task'
    ];
    const actionPath = new ActionPath(arrayActionPath);
    const matchingPaths = actionHelper.getMatchingPaths(actionPath);
    expect(matchingPaths.length)
      .toBe(2);
  });
});
