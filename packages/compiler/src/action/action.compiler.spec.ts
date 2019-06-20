import { SymbolTable } from '../symbolTable';
import { ActionCompiler, CompiledAction } from './action.compiler';

describe('ActionCompiler', () => {
  let actionCompiler: ActionCompiler;
  const appName = 'app';

  beforeEach(() => {
    actionCompiler = new ActionCompiler();
  });

  it('should compile action with HTML only', () => {
    const actionName = 'action-with-html-only';
    const action = `
      <dv.action name="${actionName}">
        <div class="col-md-2 main">
          <!-- Hello -->
          <h1>Hello</h1>
          <br/>
          <!--
            multi-line
            comment
          -->
          <p class="para">
            Lorem ipsum
          </p>
          <button type="button" class="button">Click</button>
        </div>
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});
    expect(compiledAction.ngTemplate)
      .toMatch('Hello');
    expect(compiledAction.ngTemplate)
      .not
      .toMatch('dv.action');
    expect(compiledAction.ngComponent)
      .toMatch(`selector: "${appName}-action-with-html-only"`);
  });

  it('should compile action with exprs', () => {
    const actionName = 'action-with-exprs';
    const st: SymbolTable = {
      foo: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="${actionName}">
        <foo.aliased-action as aa />
        <foo.other-actiom />
        <foo.action
          obj={a: "hi", b: 3 + 2, c: 'hello'}
          numberArray=[1, -2.5]
          objArray=[{a: 1}, {b: 2}]
          conditional=!((2 + 2e-10) === 5) ? "b" : "c"
          otherConditional=[2, 1, 3][2] lt 5 ? 3/2 : 1*2.3
          propAccess={a: 1}.a
          otherPropAccess=[{a: 1}][0].a
          propAccessOutput=foo.action.out[0]
          otherPropAccessOutput=foo.action.out[0].baz
          propAccessOutput=aa.out[1]
          otherPropAccessOutput=aa.out[1].bar
          inputPropAccess=$in.a
          otherInputPropAccess=$in.a[0]
          otherOtherInputPropAccess=$in.a[0].bar />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);
    expect(compiledAction.ngTemplate)
      .not
      .toMatch('dv.action');
    expect(compiledAction.ngTemplate)
      .toMatch('hi');
    expect(compiledAction.ngTemplate)
      .toMatch('-2.5');
    expect(compiledAction.ngTemplate)
      .toMatch('2e-10');
  });

  it('should handle strings correctly', () => {
    const st: SymbolTable = {
      foo: {
        kind: 'cliche'
      }
    };
    const actionName = 'action-strings';
    const action = `
      <dv.action name="${actionName}">
        <foo.action dq="hello" sq='hello' sqInDq="you're" />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);
    expect(compiledAction.ngTemplate)
      .not
      .toMatch('dv.action');
    expect(compiledAction.ngTemplate)
      .toMatch('\"\'hello\'\"');
    expect(compiledAction.ngTemplate)
      .toMatch(/"'you\\\'re'"/);
  });

  it('should handle attrs that don\'t have corresponding properties', () => {
    const actionName = 'action-attrs';
    const action = `
      <dv.action name="${actionName}">
        <table><tr><td colspan="2">Hi</td></tr></table>
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});
    expect(compiledAction.ngTemplate)
      .toMatch('colspan="2"');
  });

  it('should compile action with dv.if', () => {
    const actionName = 'action-with-if';
    const action = `
      <dv.action name="${actionName}">
        <dv.if condition=true class="col-md-2 main">
          <h1>Hello</h1>
        </dv.if>
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});
    expect(compiledAction.ngTemplate)
      .toMatch('Hello');
    expect(compiledAction.ngTemplate)
      .toMatch(/\*ngIf="true"/);
    expect(compiledAction.ngTemplate)
      .not
      .toMatch(/dv\.if/);
    expect(compiledAction.ngTemplate)
      .not
      .toMatch(/dv-if/);
  });

  it('should compile action with dv.if with action', () => {
    const st: SymbolTable = {
      foo: {
        kind: 'cliche',
        clicheName: 'foo'
      }
    };
    const actionName = 'action-with-if';
    const action = `
      <dv.action name="${actionName}">
        <dv.if condition=2 lt 3>
          <foo.action />
        </dv.if>
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);
    expect(compiledAction.ngTemplate)
      .toMatch('foo-action');
    expect(compiledAction.ngTemplate)
      .toMatch(/\*ngIf="2 < 3"/);
    expect(compiledAction.ngTemplate)
      .not
      .toMatch(/dv\.if/);
    expect(compiledAction.ngTemplate)
      .not
      .toMatch(/dv-if/);
  });

  it('should compile action with input action with dv.if', () => {
    const st: SymbolTable = {
      event: {
        kind: 'cliche'
      }
    };
    const actionName = 'action-with-if';
    const action = `
      <dv.action name="${actionName}">
        <event.choose-and-show-series
          showEvent=<dv.if condition=2 lt 3>
            <${appName}.action />
          </dv.if>
        />
      </dv.action>
    `;

    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);
    expect(compiledAction.ngTemplate)
      .toMatch(`[showEvent]`);
    expect(compiledAction.ngTemplate)
      .toMatch(`tag`);
    expect(compiledAction.ngTemplate)
      .toMatch(`type`);
    expect(compiledAction.actionInputs.length)
      .toBe(1);
    expect(compiledAction.actionInputs[0].ngTemplate)
      .toMatch(`${appName}-action`);
    expect(compiledAction.actionInputs[0].ngTemplate)
      .not
      .toMatch(`lt`);
  });

  it('should compile action with input action with dv.if', () => {
    const st: SymbolTable = {
      transfer: {
        kind: 'cliche',
        clicheName: 'transfer'
      }
    };
    const actionName = 'action-with-if';
    const action = `
      <dv.action name="${actionName}">
        <transfer.show-balance />
        <dv.for elems=[1, 2, 3]
        showElem= <dv.if
          condition=$elem gt= transfer.show-balance.fetchedBalance>
          <${appName}.action reward=$elem />
        </dv.if>
        />
      </dv.action>
    `;

    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);
    expect(compiledAction.ngTemplate)
      .toMatch(`[showEvent]`);
    expect(compiledAction.ngTemplate)
      .toMatch(`tag`);
    expect(compiledAction.ngTemplate)
      .toMatch(`type`);
    expect(compiledAction.actionInputs.length)
      .toBe(1);
    expect(compiledAction.actionInputs[0].ngComponent)
      .toMatch(/@Input\(\) elem/);
    expect(compiledAction.actionInputs[0].ngTemplate)
      .toMatch(`${appName}-action`);
    expect(compiledAction.actionInputs[0].ngTemplate)
      .not
      .toMatch(`gt`);
  });

  it('should compile action with actions', () => {
    const heading = 'Group meeting organizer';
    const st: SymbolTable = {
      property: {
        kind: 'cliche'
      },
      event: {
        kind: 'cliche'
      },
      allocator: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="home">
        <div class="container main">
          <div class="row">
            <div class="col-md-12">
              <div class="row">
                <div class="col-md-12">
                  <h1>${heading}</h1>
                </div>
              </div>
              <div class="row box">
                <div class="col-md-12">
                  <property.show-objects hidden=true />
                  <dv.tx>
                    <dv.gen-id />
                    <dv.status savedText="New group meeting series saved" />
                    <dv.gen-ids for=event.create-weekly-series.events />
                    <event.create-weekly-series
                      save=false
                      showOptionToSubmit=false />
                    <event.create-series
                      id=dv.gen-id.id
                      hidden=true
                      seriesEvents=event.create-weekly-series.events
                      seriesEventsIds=dv.gen-ids.ids />
                    <allocator.create-allocation hidden=true
                      id=dv.gen-id.id
                      resourceIds=dv.gen-ids.ids
                      consumerIds=property.show-objects.objectIds />
                    <dv.button>Create Group Meeting Series</dv.button>
                  </dv.tx>
                </div>
              </div>
            </div>
          </div>
        </div>
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);
    expect(compiledAction.ngTemplate)
      .toMatch(heading);
    expect(compiledAction.ngTemplate)
      .not
      .toMatch('dv.action');
  });

  it('should compile action accessing member of output', () => {
    const st: SymbolTable = {
      property: {
        kind: 'cliche'
      },
      allocator: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="show-group-meeting">
        <property.choose-object
          chooseObjectSelectPlaceholder="Champion"
          initialObjectId=allocator.edit-consumer.currentConsumer.id />
        <allocator.edit-consumer hidden=true />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);
    expect(compiledAction.ngTemplate)
      .toMatch(/\(currentConsumer\)="[\s\S]+=\s*\$event"/);
    const outputField = compiledAction.ngTemplate
      .match(/\(currentConsumer\)="([\s\S]+)=\s*\$event"/)[1]
      .trim();
    expect(compiledAction.ngComponent)
      .toMatch(outputField);
  });

  it('should compile action accessing member of output of ' +
    'aliased action', () => {
    const st: SymbolTable = {
      property: {
        kind: 'cliche'
      },
      allocator: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="show-group-meeting">
        <property.choose-object
          chooseObjectSelectPlaceholder="Champion"
          initialObjectId=ec.currentConsumer.id />
        <allocator.edit-consumer as ec hidden=true />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);
    expect(compiledAction.ngTemplate)
      .toMatch(/\(currentConsumer\)=".+=\$event"/);
    const outputField = compiledAction.ngTemplate
      .match(/\(currentConsumer\)="(.+)=\$event"/)[1];
    expect(compiledAction.ngComponent)
      .toMatch(outputField);
  });

  it('should compile action accessing member of output of aliased action ' +
    'with elvis', () => {
    const st: SymbolTable = {
      property: {
        kind: 'cliche'
      },
      allocator: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="show-group-meeting">
        <property.choose-object
          chooseObjectSelectPlaceholder="Champion"
          initialObjectId=ec.currentConsumer?.id />
        <allocator.edit-consumer as ec hidden=true />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);
    expect(compiledAction.ngTemplate)
      .toMatch(
        /\[initialObjectId\]=".*currentConsumer__ec\?\.id"/);
    expect(compiledAction.ngTemplate)
      .toMatch(/\(currentConsumer\)=".+=\$event"/);
    const outputField = compiledAction.ngTemplate
      .match(/\(currentConsumer\)="(.+)=\$event"/)[1];
    expect(compiledAction.ngComponent)
      .toMatch(outputField);
  });

  it('should compile action with output', () => {
    const st: SymbolTable = {
      property: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="action-with-outputs"
        objects$=property.show-objects.objects>
        <property.show-objects hidden=true />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);

    expect(compiledAction.ngComponent)
      .toMatch('@Output()');
    expect(compiledAction.ngComponent)
      .toMatch('new EventEmitter');
    expect(compiledAction.ngComponent)
      .toMatch(/import .* EventEmitter .*/);
    expect(compiledAction.ngComponent)
      .toMatch('emit');
  });

  it('should compile action with output expr', () => {
    const st: SymbolTable = {
      property: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="action-with-output-expr"
        objects$=property.show-objects.objects.length + 1>
        <property.show-objects hidden=true />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);

    expect(compiledAction.ngComponent)
      .toMatch('@Output()');
    expect(compiledAction.ngComponent)
      .toMatch('emit');
    expect(compiledAction.ngComponent)
      .toMatch(/\+ 1/);
    expect(compiledAction.ngComponent)
      .toMatch('emit');
  });

  it('should compile action with output expr', () => {
    const st: SymbolTable = {
      property: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="action-with-output-expr"
        objects$=property.show-objects.objects.length + 1>
        <property.show-objects hidden=true />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);

    expect(compiledAction.ngComponent)
      .toMatch('@Output()');
    expect(compiledAction.ngComponent)
      .toMatch('emit');
    expect(compiledAction.ngComponent)
      .toMatch(/\+ 1/);
  });

  it('should compile action with input', () => {
    const st: SymbolTable = {
      property: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="action-with-input">
        <property.show-objects hidden=true object=$supply />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);

    expect(compiledAction.ngTemplate)
      .toMatch(/\[hidden]="true"/);
  });

  it('should compile action with action input', () => {
    const st: SymbolTable = {
      event: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="home">
        <event.choose-and-show-series
          showEvent=<event.show-event/>
          noEventsToShowText="No meetings to show"
          chooseSeriesSelectPlaceholder="Choose Meeting Series" />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);
    expect(compiledAction.ngTemplate)
      .toMatch(`[showEvent]`);
    expect(compiledAction.ngTemplate)
      .toMatch(`tag`);
    expect(compiledAction.ngTemplate)
      .toMatch(`type`);
    expect(compiledAction.actionInputs.length)
      .toBe(1);
    expect(compiledAction.actionInputs[0].ngTemplate)
      .toMatch(`show-event`);
  });

  /* TODO: fix the parsing bug exposed by this test.
      The action fails to parse when `assigneeId=...` appears first
  it('should compile action with action input with inputs', () => {
    const st: SymbolTable = {
      task: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="home">
        <${appName}.child-navbar />
        <task.show-tasks
          assigneeId=chorestar.child-navbar.user?.id
          noTasksToShowText="No uncompleted chores"
          completed=false
          showOptionToComplete=true
          showTask=<${appName}.show-chore chore=$task view="hello" /> />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);
    expect(compiledAction.ngTemplate)
      .toMatch(`[showTask]`);
    expect(compiledAction.ngTemplate)
      .toMatch(`tag`);
    expect(compiledAction.ngTemplate)
      .toMatch(`type`);
    expect(compiledAction.actionInputs.length)
      .toBe(1);
    expect(compiledAction.actionInputs[0].ngTemplate)
      .toMatch(`show-task`);
  }); */

  it('should compile action with html action input', () => {
    const st: SymbolTable = {
      event: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="home">
        <event.choose-and-show-series
          showEvent=<h1>Event</h1>
          noEventsToShowText="No meetings to show"
          chooseSeriesSelectPlaceholder="Choose Meeting Series" />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, st);
    expect(compiledAction.ngTemplate)
      .toMatch(`[showEvent]`);
    expect(compiledAction.ngTemplate)
      .toMatch(`tag`);
    expect(compiledAction.ngTemplate)
      .toMatch(`type`);
  });

  it('should compile app action with action input ' +
    'that uses context outputs', () => {
      const st: SymbolTable = {
        event: {
          kind: 'cliche'
        },
        foo: {
          kind: 'cliche'
        }
      };
      const action = `
      <dv.action name="home">
        <foo.action />
        <event.choose-and-show-series
          showEvent=
            <${appName}.show-group-meeting
              groupMeeting=foo.action.someValue />
          noEventsToShowText="No meetings to show"
          chooseSeriesSelectPlaceholder="Choose Meeting Series" />
      </dv.action>
    `;
      const compiledAction: CompiledAction = actionCompiler
        .compile(appName, action, st);
      expect(compiledAction.ngTemplate)
        .toMatch(`[showEvent]`);
      expect(compiledAction.ngTemplate)
        .toMatch(`tag`);
      expect(compiledAction.ngTemplate)
        .toMatch(`type`);
      expect(compiledAction.ngTemplate)
        .toMatch(`inputs`);
      expect(compiledAction.actionInputs.length)
        .toBe(1);
      const actionInput = compiledAction.actionInputs[0];
      expect(actionInput.ngTemplate)
        .toMatch(`show-group-meeting`);
      const inputRegex = /@Input\(\)\s+(.*);/;
      expect(actionInput.ngComponent)
        .toMatch(inputRegex);

      const inputField = actionInput.ngComponent
        .match(inputRegex)[1];
      expect(actionInput.ngTemplate)
        .toMatch(inputField);

      const inputsObjRegex = new RegExp(
        `{\\s*${inputField}:\\s*([^}\\s]*)\\s*}`);

      expect(compiledAction.ngTemplate)
        .toMatch(inputsObjRegex);

      const outputField = compiledAction.ngTemplate
        .match(inputsObjRegex)[1];
      expect(compiledAction.ngTemplate)
        .toMatch(`${outputField}=`);
      expect(compiledAction.ngComponent)
        .toMatch(outputField);

      expect(compiledAction.ngTemplate)
        .toMatch('capture__');
    });

  it('should compile cliche action with action input ' +
    'that uses context outputs', () => {
      const st: SymbolTable = {
        scoring: {
          kind: 'cliche'
        },
        foo: {
          kind: 'cliche'
        }
      };
      const action = `
      <dv.action name="home">
        <foo.navbar />
        <div>
          <scoring.show-targets-by-score
            showTarget=<foo.show-post
            loggedInUser=foo.navbar.loggedInUser />
          >
          </scoring.show-targets-by-score>
        </div>
      </dv.action>`;
      const compiledAction: CompiledAction = actionCompiler
        .compile(appName, action, st);
      expect(compiledAction.ngTemplate)
        .toMatch(`[showTarget]`);
      expect(compiledAction.ngTemplate)
        .toMatch(`tag`);
      expect(compiledAction.ngTemplate)
        .toMatch(`type`);
      expect(compiledAction.ngTemplate)
        .toMatch(`inputs`);
      expect(compiledAction.actionInputs.length)
        .toBe(1);
      const actionInput = compiledAction.actionInputs[0];
      expect(actionInput.ngTemplate)
        .toMatch(`show-post`);
      const inputRegex = /@Input\(\)\s+(.*);/;
      expect(actionInput.ngComponent)
        .toMatch(inputRegex);

      const inputField = actionInput.ngComponent
        .match(inputRegex)[1];
      expect(actionInput.ngTemplate)
        .toMatch(inputField);

      const inputsObjRegex = new RegExp(
        `{\\s*${inputField}:\\s*([^}\\s]*)\\s*}`);

      expect(compiledAction.ngTemplate)
        .toMatch(inputsObjRegex);

      const outputField = compiledAction.ngTemplate
        .match(inputsObjRegex)[1];
      expect(compiledAction.ngTemplate)
        .toMatch(`${outputField}=`);
      expect(compiledAction.ngComponent)
        .toMatch(outputField);

      expect(compiledAction.ngTemplate)
        .toMatch('capture__');
    });

    it('should compile action with action input ' +
    'that uses context', () => {
      const st: SymbolTable = {
        scoring: {
          kind: 'cliche'
        },
        foo: {
          kind: 'cliche'
        }
      };
      const action = `
      <dv.action name="home">
        <foo.navbar />
        <div>
          <scoring.show-targets-by-score
            showTarget=<foo.show-post
            loggedInUser=foo.navbar.loggedInUser />
          >
          </scoring.show-targets-by-score>
        </div>
      </dv.action>`;
      const compiledAction: CompiledAction = actionCompiler
        .compile(appName, action, st);
      expect(compiledAction.ngTemplate)
        .toMatch(`[showTarget]`);
      expect(compiledAction.ngTemplate)
        .toMatch(`tag`);
      expect(compiledAction.ngTemplate)
        .toMatch(`type`);
      expect(compiledAction.ngTemplate)
        .toMatch(`inputs`);
      expect(compiledAction.actionInputs.length)
        .toBe(1);
      const actionInput = compiledAction.actionInputs[0];
      expect(actionInput.ngTemplate)
        .toMatch(`show-post`);
      const inputRegex = /@Input\(\)\s+(.*);/;
      expect(actionInput.ngComponent)
        .toMatch(inputRegex);

      const inputField = actionInput.ngComponent
        .match(inputRegex)[1];
      expect(actionInput.ngTemplate)
        .toMatch(inputField);

      const inputsObjRegex = new RegExp(
        `{\\s*${inputField}:\\s*([^}\\s]*)\\s*}`);

      expect(compiledAction.ngTemplate)
        .toMatch(inputsObjRegex);

      const outputField = compiledAction.ngTemplate
        .match(inputsObjRegex)[1];
      expect(compiledAction.ngTemplate)
        .toMatch(`${outputField}=`);
      expect(compiledAction.ngComponent)
        .toMatch(outputField);

      expect(compiledAction.ngTemplate)
        .toMatch('capture__');
    });

  it('should compile action with action input ' +
    'that captures context inputs with member access', () => {
      const st: SymbolTable = {
        scoring: {
          kind: 'cliche'
        },
        foo: {
          kind: 'cliche'
        }
      };
      const action = `
      <dv.action name="home">
        <foo.navbar id=$myId.id />
        <div>
          <scoring.show-targets-by-score
            showTarget=<div>
              <foo.other-navbar />
              <foo.create-post id=$myId.id user=foo.navbar.user />
            </div>
          />
        </div>
      </dv.action>`;
      const compiledAction: CompiledAction = actionCompiler
        .compile(appName, action, st);
      expect(compiledAction.ngTemplate)
        .toMatch(/\[showTarget\]/);
      expect(compiledAction.ngTemplate)
        .toMatch(`tag`);
      expect(compiledAction.ngTemplate)
        .toMatch(`type`);

      const inputsObjRegex = (inputField) => new RegExp(
        `${inputField}:\\s*([^}\\s]*)`);

      expect(compiledAction.ngTemplate)
        .toMatch(inputsObjRegex(`capture__foo_navbar_user`));
      expect(compiledAction.ngTemplate)
        .toMatch(inputsObjRegex(`capture__myId`));

      expect(compiledAction.actionInputs.length)
        .toBe(1);
      const actionInput = compiledAction.actionInputs[0];
      expect(actionInput.ngTemplate)
        .toMatch(`navbar`);
      expect(actionInput.ngTemplate)
        .toMatch(`create-post`);
      expect(actionInput.ngTemplate)
        .toMatch(/\[id\]="capture__myId.id"/);
      expect(actionInput.ngComponent)
        .toMatch(/@Input\(\) capture__myId;/);
  });

  it('should compile action with action input ' +
    'that captures context inputs', () => {
      const st: SymbolTable = {
        scoring: {
          kind: 'cliche'
        },
        foo: {
          kind: 'cliche'
        }
      };
      const action = `
      <dv.action name="home">
        <foo.navbar id=$myId />
        <div>
          <scoring.show-targets-by-score
            showTarget=<div><foo.create-post id=$myId /></div>
          />
        </div>
      </dv.action>`;
      const compiledAction: CompiledAction = actionCompiler
        .compile(appName, action, st);
      expect(compiledAction.ngTemplate)
        .toMatch(/\[showTarget\]/);
      expect(compiledAction.ngTemplate)
        .toMatch(`tag`);
      expect(compiledAction.ngTemplate)
        .toMatch(`type`);

      const inputsObjRegex = (inputField) => new RegExp(
        `${inputField}:\\s*([^}\\s]*)`);

      expect(compiledAction.ngTemplate)
        .toMatch(inputsObjRegex(`capture__myId`));

      expect(compiledAction.ngTemplate)
        .toMatch(/capture__myId:\s*myId\s*/);
      expect(compiledAction.ngComponent)
        .toMatch(/@Input\(\) myId/);

      expect(compiledAction.actionInputs.length)
        .toBe(1);
      const actionInput = compiledAction.actionInputs[0];
      expect(actionInput.ngTemplate)
        .toMatch(`create-post`);
      expect(actionInput.ngTemplate)
        .toMatch(/\[id\]="capture__myId"/);
      expect(actionInput.ngComponent)
        .toMatch(/@Input\(\) capture__myId;/);
  });

  it('should compile action with action input ' +
    'that captures context inputs', () => {
      const st: SymbolTable = {
        scoring: {
          kind: 'cliche'
        },
        foo: {
          kind: 'cliche'
        }
      };
      const action = `
      <dv.action name="home">
        <foo.navbar id=$myId />
        <div>
          <scoring.show-targets-by-score
            showTarget=<${appName}.create-post id=$myId />
          />
        </div>
      </dv.action>`;
      const compiledAction: CompiledAction = actionCompiler
        .compile(appName, action, st);
      expect(compiledAction.ngTemplate)
        .toMatch(/\[showTarget\]/);
      expect(compiledAction.ngTemplate)
        .toMatch(`tag`);
      expect(compiledAction.ngTemplate)
        .toMatch(`type`);

      const inputsObjRegex = (inputField) => new RegExp(
        `${inputField}:\\s*([^}\\s]*)`);

      expect(compiledAction.ngTemplate)
        .toMatch(inputsObjRegex(`capture__myId`));

      expect(compiledAction.ngTemplate)
        .toMatch(/capture__myId:\s*myId\s*/);
      expect(compiledAction.ngComponent)
        .toMatch(/@Input\(\) myId/);

      expect(compiledAction.actionInputs.length)
        .toBe(1);
      const actionInput = compiledAction.actionInputs[0];
      expect(actionInput.ngTemplate)
        .toMatch(`create-post`);
      expect(actionInput.ngTemplate)
        .toMatch(/\[id\]="capture__myId"/);
      expect(actionInput.ngComponent)
        .toMatch(/@Input\(\) capture__myId;/);
  });

  it('should compile action with action input ' +
    'that maps outputs', () => {
      const st: SymbolTable = {
        event: {
          kind: 'cliche'
        }
      };
      const action = `
    <dv.action name="home">
      <event.choose-and-show-series
        showEvent=
          <dv.action meeting$=${appName}.show-group-meeting.shownGroupMeeting>
            <${appName}.show-group-meeting
              groupMeeting=$event
              groupMeetings=$events />
          </dv.action>
        noEventsToShowText="No meetings to show"
        chooseSeriesSelectPlaceholder="Choose Meeting Series" />
    </dv.action>
  `;

      const compiledAction: CompiledAction = actionCompiler
        .compile(appName, action, st);
      expect(compiledAction.ngTemplate)
        .toMatch(`[showEvent]`);
      expect(compiledAction.ngTemplate)
        .toMatch(`tag`);
      expect(compiledAction.ngTemplate)
        .toMatch(`type`);
    });

  it('should compile action with action input that maps outputs ' +
    'where multiple actions are from the same cliche', () => {
      const st: SymbolTable = {
        event: {
          kind: 'cliche'
        }
      };
      const action = `
    <dv.action name="home">
      <event.choose-and-show-series
        showEvent=
          <dv.action meeting$=event.show-events.fetchedEvents>
            <event.show-events />
          </dv.action>
        noEventsToShowText="No meetings to show"
        chooseSeriesSelectPlaceholder="Choose Meeting Series" />
    </dv.action>
  `;

      const compiledAction: CompiledAction = actionCompiler
        .compile(appName, action, st);
      expect(compiledAction.ngTemplate)
        .toMatch(`[showEvent]`);
      expect(compiledAction.ngTemplate)
        .toMatch(`tag`);
      expect(compiledAction.ngTemplate)
        .toMatch(`type`);
    });

  it('should compile action with an alias', () => {
    const st: SymbolTable = {
      property: {
        kind: 'cliche'
      },
      foo: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="action-with-alias">
        <property.show-objects as prop hidden=true />
        <foo.show stuff=prop.objects />
      </dv.action>
    `;
    actionCompiler.compile(appName, action, st);
  });

  it('should fail if dv-tx is aliased', () => {
    const st: SymbolTable = {
      property: {
        kind: 'cliche'
      },
      scoring: {
        kind: 'cliche'
      }
    };
    const action = `
      <dv.action name="action-with-tx-alias">
        <dv.tx as foo>
          <property.create-object />
          <scoring.create-score />
        </dv.tx>
      </dv.action>
    `;
    expect(() => actionCompiler.compile(appName, action, st))
      .toThrow();
  });
});
