import { ActionHelper , ActionTable } from '../src/actionHelper';
import { ActionPath } from '../src/actionPath';

describe('ActionHelper', () => {
  it('can be created', () => {
    expect(new ActionHelper(null, null, null)).toBeTruthy();
  });

  it('is well', () => {
    const actionTable: ActionTable = {
      'chorestar-root': [
        {
          fqtag: 'router-outlet',
          tag: 'router-outlet'
        }
      ],
      'chorestar-child-home': [
        {
          fqtag: 'chorestar-nav-bar',
          tag: 'chorestar-nav-bar',
          inputs: {
            for: 'child',
            '(loggedInUser)': 'user=$event'
          }
        },
        {
          fqtag: 'group-show-groups',
          tag: 'group-show-groups',
          inputs: {
            '[withMemberId]': 'user?.id',
            '(groups)': 'parent=$event[0]',
            '[hidden]': 'true'
          }
        },
        {
          fqtag: 'transfer-show-balance',
          tag: 'transfer-show-balance',
          inputs: {
            '[accountId]': 'user?.id',
            '(fetchedBalance)': 'balance=$event'
          }
        },
        {
          fqtag: 'task-show-tasks',
          tag: 'task-show-tasks',
          inputs: {
            '[assigneeId]': 'user?.id',
            '[completed]': 'false',
            '[showTask]': `{
              type: showChore,
              tag: 'chorestar-show-chore',
              inputMap: { task: 'chore'},
              inputs: { view: 'child' }
            }`,
            '[showOptionToComplete]': 'true',
            noTasksToShowText: 'No uncompleted chores'
          }
        },
        {
          fqtag: 'task-show-tasks',
          tag: 'task-show-tasks',
          inputs: {
            '[assigneeId]': 'user?.id',
            '[completed]': 'true',
            '[approved]': 'false',
            '[showTask]': `{
              type: showChore,
              tag: 'chorestar-show-chore',
              inputMap: { task: 'chore'},
              inputs: { view: 'child' }
            }`,
            noTasksToShowText: 'No chores pending approval'
          }
        },
        {
          fqtag: 'task-show-tasks',
          tag: 'task-show-tasks',
          inputs: {
            '[assigneeId]': 'user?.id',
            '[completed]': 'true',
            '[approved]': 'true',
            '[showTask]': `{
              type: showChore,
              tag: 'chorestar-show-chore',
              inputMap: { task: 'chore'},
              inputs: { view: 'child' }
            }`,
            noTasksToShowText: 'No approved chores'
          }
        },
        {
          fqtag: 'reward-show-objects',
          dvOf: 'reward',
          tag: 'property-show-objects',
          inputs: {
            dvOf: 'reward',
            '(objects)': 'rewards=$event',
            '[hidden]': 'true',
            '[showOnly]': '["name", "cost"]'
          }
        },
        {
          fqtag: 'chorestar-show-reward',
          tag: 'chorestar-show-reward',
          inputs: {
            '*ngIf': 'reward.cost <= balance',
            '[reward]': 'reward',
            '[user]': 'user',
            '[showOptionToPurchase]': 'true'
          }
        },
        {
          fqtag: 'chorestar-show-reward',
          tag: 'chorestar-show-reward',
          inputs: {
            '*ngIf': 'reward.cost > balance',
            '[reward]': 'reward',
            '[user]': 'user',
            '[showOptionToPurchase]': 'false'
          }
        }
      ],
      'chorestar-create-chore': [
        {
          fqtag: 'dv-tx',
          tag: 'dv-tx',
          content: [
            {
              fqtag: 'dv-id',
              tag: 'dv-id',
              inputs: {
                '(id)': 'choreId=$event'
              }
            },
            {
              fqtag: 'dv-status',
              tag: 'dv-status',
              inputs: {
                savedText: 'Chore created'
              }
            },
            {
              fqtag: 'chore-create-object',
              dvOf: 'chore',
              tag: 'property-create-object',
              inputs: {
                dvOf: 'chore',
                '[id]': 'choreId',
                '[showOptionToSubmit]': 'false'
              }
            },
            {
              fqtag: 'task-create-task',
              tag: 'task-create-task',
              inputs: {
                '[id]': 'choreId',
                '[assignerId]': 'user?.id',
                '[assigneeId]': 'choreAssigneeId',
                '[showOptionToInputAssignee]': 'false',
                '[showOptionToSubmit]': 'false'
              }
            },
            {
              fqtag: 'child-choose-object',
              dvOf: 'child',
              tag: 'property-choose-object',
              inputs: {
                dvOf: 'child',
                chooseObjectSelectPlaceholder: 'Select Assignee',
                '[showOnly]': '["name"]',
                '(selectedObjectId)': 'choreAssigneeId=$event'
              }
            },
            {
              fqtag: 'dv-button',
              tag: 'dv-button'
            }
          ]
        }
      ],
      'chorestar-landing': [
        {
          fqtag: 'dv-tx',
          tag: 'dv-tx',
          content: [
            {
              fqtag: 'parentauthentication-sign-in',
              dvOf: 'parentauthentication',
              tag: 'authentication-sign-in',
              inputs: {
                dvOf: 'parentauthentication'
              }
            },
            {
              fqtag: 'dv-link',
              tag: 'dv-link',
              inputs: {
                href: '/parent',
                '[hidden]': 'true'
              }
            }
          ]
        },
        {
          fqtag: 'dv-tx',
          tag: 'dv-tx',
          content: [
            {
              fqtag: 'childauthentication-sign-in',
              dvOf: 'childauthentication',
              tag: 'authentication-sign-in',
              inputs: {
                dvOf: 'childauthentication'
              }
            },
            {
              fqtag: 'dv-link',
              tag: 'dv-link',
              inputs: {
                href: '/child',
                '[hidden]': 'true'
              }
            }
          ]
        },
        {
          fqtag: 'dv-tx',
          tag: 'dv-tx',
          content: [
            {
              fqtag: 'dv-id',
              tag: 'dv-id',
              inputs: {
                '(id)': 'parentId=$event'
              }
            },
            {
              fqtag: 'parentauthentication-register-user',
              dvOf: 'parentauthentication',
              tag: 'authentication-register-user',
              inputs: {
                '[id]': 'parentId',
                dvOf: 'parentauthentication'
              }
            },
            {
              fqtag: 'group-create-group',
              tag: 'group-create-group',
              inputs: {
                '[id]': 'parentId',
                '[hidden]': 'true'
              }
            },
            {
              fqtag: 'dv-link',
              tag: 'dv-link',
              inputs: {
                href: '/parent',
                '[hidden]': 'true'
              }
            }
          ]
        }
      ],
      'chorestar-nav-bar': [
        {
          fqtag: 'authentication-logged-in',
          tag: 'authentication-logged-in',
          inputs: {
            '(user)': 'user=$event; user=$event; outputAsLoggedInUser($event)',
            '[dvOf]': 'for + "authentication"'
          }
        },
        {
          fqtag: 'authentication-show-user',
          tag: 'authentication-show-user',
          inputs: {
            '[user]': 'user',
            '[dvOf]': 'for + "authentication"'
          }
        },
        {
          fqtag: 'dv-tx',
          tag: 'dv-tx',
          content: [
            {
              fqtag: 'authentication-sign-out',
              tag: 'authentication-sign-out',
              inputs: {
                '[dvOf]': 'for + "authentication"'
              }
            },
            {
              fqtag: 'dv-link',
              tag: 'dv-link',
              inputs: {
                href: '/',
                '[hidden]': 'true'
              }
            }
          ]
        }
      ],
      'chorestar-parent-home': [
        {
          fqtag: 'chorestar-nav-bar',
          tag: 'chorestar-nav-bar',
          inputs: {
            for: 'parent',
            '(loggedInUser)': 'user=$event'
          }
        },
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
          fqtag: 'chorestar-create-chore',
          tag: 'chorestar-create-chore',
          inputs: {
            '[user]': 'user'
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
              fqtag: 'dv-id',
              tag: 'dv-id',
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
              fqtag: 'dv-id',
              tag: 'dv-id',
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
      'chorestar-show-reward': [
        {
          fqtag: 'transfer-add-to-balance',
          tag: 'transfer-add-to-balance',
          inputs: {
            '*ngIf': 'showOptionToPurchase',
            '[showOptionToInputAccountId]': 'false',
            '[showOptionToInputBalance]': 'false',
            '[accountId]': 'user.id',
            '[amount]': '-1 * reward.cost',
            buttonLabel: 'Purchase',
            newTransferSavedText: 'Reward purchased.'
          }
        }
      ]
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
      },
      {
        path: 'child',
        action: 'chorestar-child-home'
      },
      {
        path: '',
        action: 'chorestar-landing'
      }
    ];
    const actionHelper = new ActionHelper(actionTable, usedCliches, routes);

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
    expect(matchingPaths.length).toBe(1);
  });
});
