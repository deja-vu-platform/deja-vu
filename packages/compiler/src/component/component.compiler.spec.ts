import { SymbolTable } from '../symbolTable';
import { CompiledComponent, ComponentCompiler } from './component.compiler';


function expectInputMatch(component: CompiledComponent): string {
  const inputRegex = /@Input\(\)\s+(.*);/;
  expect(component.ngComponent)
    .toMatch(inputRegex);

  const inputField = component.ngComponent
    .match(inputRegex)[1];
  expect(component.ngTemplate)
    .toMatch(inputField);

  return inputField;
}

function expectOutputMatch(
  output: string, component: CompiledComponent): string {
  expect(component.ngTemplate)
    .toMatch(`\\(${output}\\)="\\S+\\s*=\\s*\\$event"`);
  const outputField = component.ngTemplate
    .match(`\\(${output}\\)="(\\S+)\\s*=\\s*\\$event"`)[1];
  expect(component.ngComponent)
    .toMatch(outputField);

  return outputField;
}


describe('ComponentCompiler', () => {
  let componentCompiler: ComponentCompiler;
  const appName = 'app';

  beforeEach(() => {
    componentCompiler = new ComponentCompiler();
  });

  it('should compile component with HTML only', () => {
    const componentName = 'component-with-html-only';
    const component = `
      <dv.component name="${componentName}">
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
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, {});
    expect(compiledComponent.ngTemplate)
      .toMatch('Hello');
    expect(compiledComponent.ngTemplate)
      .not
      .toMatch('dv.component');
    expect(compiledComponent.ngComponent)
      .toMatch(`selector: "${appName}-component-with-html-only"`);
  });

  it('should compile component with exprs', () => {
    const componentName = 'component-with-exprs';
    const st: SymbolTable = {
      foo: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="${componentName}">
        <foo.aliased-component as aa />
        <foo.other-actiom />
        <foo.component
          obj={a: "hi", b: 3 + 2, c: 'hello', 'h e': 'llo'}
          numberArray=[1, -2.5]
          objArray=[{a: 1}, {b: 2}]
          conditional=!((2 + 2e-10) === 5) ? "b" : "c"
          otherConditional=[2, 1, 3][2] lt 5 ? 3/2 : 1*2.3
          propAccess={a: 1}.a
          otherPropAccess=[{a: 1}][0].a
          propAccessOutput=foo.component.out[0]
          otherPropAccessOutput=foo.component.out[0].baz
          propAccessOutput=aa.out[1]
          otherPropAccessOutput=aa.out[1].bar
          inputPropAccess=$in.a
          otherInputPropAccess=$in.a[0]
          otherOtherInputPropAccess=$in.a[0].bar />
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);
    expect(compiledComponent.ngTemplate)
      .not
      .toMatch('dv.component');
    expect(compiledComponent.ngTemplate)
      .toMatch('hi');
    expect(compiledComponent.ngTemplate)
      .toMatch('-2.5');
    expect(compiledComponent.ngTemplate)
      .toMatch('2e-10');
  });

  it('should compile component with interpolation', () => {
    const componentName = 'component-with-interpolation';
    const st: SymbolTable = {
      foo: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="${componentName}">
        <foo.aliased-component as aa />
        <foo.other-component />
        String: {{ "hi" }}
        Output: {{ aa.out[0] }}
        Input: {{ $in.a }}
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);
    expect(compiledComponent.ngTemplate)
      .not
      .toMatch('dv.component');
    expect(compiledComponent.ngTemplate)
      .toMatch(`{{ "hi" }}`);

    const inputField = expectInputMatch(compiledComponent);
    expect(compiledComponent.ngTemplate)
      .toMatch(`{{ ${inputField}.a }}`);

    const outputField = expectOutputMatch('out', compiledComponent);
    expect(compiledComponent.ngTemplate)
      .toMatch(`{{ ${outputField}\\[0\\] }}`);
  });

  it('should handle strings correctly', () => {
    const st: SymbolTable = {
      foo: {
        kind: 'concept'
      }
    };
    const componentName = 'component-strings';
    const component = `
      <dv.component name="${componentName}">
        <foo.component dq="hello" sq='hello' sqInDq="you're" />
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);
    expect(compiledComponent.ngTemplate)
      .not
      .toMatch('dv.component');
    expect(compiledComponent.ngTemplate)
      .toMatch('\"\'hello\'\"');
    expect(compiledComponent.ngTemplate)
      .toMatch(/"'you\\\'re'"/);
  });

  it('should handle attrs that don\'t have corresponding properties', () => {
    const componentName = 'component-attrs';
    const component = `
      <dv.component name="${componentName}">
        <table><tr><td colspan="2">Hi</td></tr></table>
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, {});
    expect(compiledComponent.ngTemplate)
      .toMatch('colspan="2"');
  });

  it('should compile component with dv.if', () => {
    const componentName = 'component-with-if';
    const component = `
      <dv.component name="${componentName}">
        <dv.if condition=true class="col-md-2 main">
          <h1>Hello</h1>
        </dv.if>
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, {});
    expect(compiledComponent.ngTemplate)
      .toMatch('Hello');
    expect(compiledComponent.ngTemplate)
      .toMatch(/\*ngIf="true"/);
    expect(compiledComponent.ngTemplate)
      .not
      .toMatch(/dv\.if/);
    expect(compiledComponent.ngTemplate)
      .not
      .toMatch(/dv-if/);
  });

  it('should compile component with dv.if with component', () => {
    const st: SymbolTable = {
      foo: {
        kind: 'concept',
        conceptName: 'foo'
      }
    };
    const componentName = 'component-with-if';
    const component = `
      <dv.component name="${componentName}">
        <dv.if condition=2 lt 3>
          <foo.component />
        </dv.if>
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);
    expect(compiledComponent.ngTemplate)
      .toMatch('foo-component');
    expect(compiledComponent.ngTemplate)
      .toMatch(/\*ngIf="2 < 3"/);
    expect(compiledComponent.ngTemplate)
      .not
      .toMatch(/dv\.if/);
    expect(compiledComponent.ngTemplate)
      .not
      .toMatch(/dv-if/);
  });

  it('should compile component with input component with dv.if', () => {
    const st: SymbolTable = {
      event: {
        kind: 'concept'
      }
    };
    const componentName = 'component-with-if';
    const component = `
      <dv.component name="${componentName}">
        <event.choose-and-show-series
          showEvent=<dv.if condition=2 lt 3>
            <${appName}.component />
          </dv.if>
        />
      </dv.component>
    `;

    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);
    expect(compiledComponent.ngTemplate)
      .toMatch(`[showEvent]`);
    expect(compiledComponent.ngTemplate)
      .toMatch(`tag`);
    expect(compiledComponent.ngTemplate)
      .toMatch(`type`);
    expect(compiledComponent.componentInputs.length)
      .toBe(1);
    expect(compiledComponent.componentInputs[0].ngTemplate)
      .toMatch(`${appName}-component`);
    expect(compiledComponent.componentInputs[0].ngTemplate)
      .not
      .toMatch(`lt`);
  });

  it('should compile component with input component with dv.if', () => {
    const st: SymbolTable = {
      transfer: {
        kind: 'concept',
        conceptName: 'transfer'
      }
    };
    const componentName = 'component-with-if';
    const component = `
      <dv.component name="${componentName}">
        <transfer.show-balance />
        <dv.for elems=[1, 2, 3]
        showElem= <dv.if
          condition=$elem gt= transfer.show-balance.fetchedBalance>
          <${appName}.component reward=$elem />
        </dv.if>
        />
      </dv.component>
    `;

    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);
    expect(compiledComponent.ngTemplate)
      .toMatch(`[showEvent]`);
    expect(compiledComponent.ngTemplate)
      .toMatch(`tag`);
    expect(compiledComponent.ngTemplate)
      .toMatch(`type`);
    expect(compiledComponent.componentInputs.length)
      .toBe(1);
    expect(compiledComponent.componentInputs[0].ngComponent)
      .toMatch(/@Input\(\) elem/);
    expect(compiledComponent.componentInputs[0].ngTemplate)
      .toMatch(`${appName}-component`);
    expect(compiledComponent.componentInputs[0].ngTemplate)
      .not
      .toMatch(`gt`);
  });

  it('should compile tx-component', () => {
    const componentName = 'tx-component';
    const component = `
      <dv.tx-component name="${componentName}">
        <h1>Hello</h1>
      </dv.tx-component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, {});
    expect(compiledComponent.ngTemplate)
      .toMatch('Hello');
    expect(compiledComponent.ngTemplate)
      .toMatch('dv-tx');
    expect(compiledComponent.ngTemplate)
      .not
      .toMatch('dv.tx-component');
    expect(compiledComponent.ngComponent)
      .toMatch(`selector: "${appName}-tx-component"`);
  });

  it('should compile component with components', () => {
    const heading = 'Group meeting organizer';
    const st: SymbolTable = {
      property: {
        kind: 'concept'
      },
      event: {
        kind: 'concept'
      },
      allocator: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="home">
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
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);
    expect(compiledComponent.ngTemplate)
      .toMatch(heading);
    expect(compiledComponent.ngTemplate)
      .not
      .toMatch('dv.component');
  });

  it('should compile component accessing member of output', () => {
    const st: SymbolTable = {
      property: {
        kind: 'concept'
      },
      allocator: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="show-group-meeting">
        <property.choose-object
          chooseObjectSelectPlaceholder="Champion"
          initialObjectId=allocator.edit-consumer.currentConsumer.id />
        <allocator.edit-consumer hidden=true />
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);
    expect(compiledComponent.ngTemplate)
      .toMatch(/\(currentConsumer\)="[\s\S]+=\s*\$event\s*"/);
    const outputField = compiledComponent.ngTemplate
      .match(/\(currentConsumer\)="([\s\S]+)=\s*\$event\s*"/)[1]
      .trim();
    expect(compiledComponent.ngComponent)
      .toMatch(outputField);
  });

  it('should compile component accessing member of output of ' +
    'aliased component', () => {
    const st: SymbolTable = {
      property: {
        kind: 'concept'
      },
      allocator: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="show-group-meeting">
        <property.choose-object
          chooseObjectSelectPlaceholder="Champion"
          initialObjectId=ec.currentConsumer.id />
        <allocator.edit-consumer as ec hidden=true />
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);
    expect(compiledComponent.ngTemplate)
      .toMatch(/\(currentConsumer\)="[\s\S]+=\s*\$event\s*"/);
    const outputField = compiledComponent.ngTemplate
      .match(/\(currentConsumer\)="([\s\S]+)=\s*\$event\s*"/)[1]
      .trim();
    expect(compiledComponent.ngComponent)
      .toMatch(outputField);
  });

  it('should compile component accessing member of output of aliased ' +
    'component with elvis', () => {
    const st: SymbolTable = {
      property: {
        kind: 'concept'
      },
      allocator: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="show-group-meeting">
        <property.choose-object
          chooseObjectSelectPlaceholder="Champion"
          initialObjectId=ec.currentConsumer?.id />
        <allocator.edit-consumer as ec hidden=true />
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);
    expect(compiledComponent.ngTemplate)
      .toMatch(
        /\[initialObjectId\]="[\s\S]*currentConsumer__ec\?\.id\s*"/);
    expect(compiledComponent.ngTemplate)
      .toMatch(/\(currentConsumer\)="[\s\S]+=\s*\$event\s*"/);
    const outputField = compiledComponent.ngTemplate
      .match(/\(currentConsumer\)="([\s\S]+)=\s*\$event\s*"/)[1]
      .trim();
    expect(compiledComponent.ngComponent)
      .toMatch(outputField);
  });

  it('should compile component with output', () => {
    const st: SymbolTable = {
      property: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="component-with-outputs"
        objects$=property.show-objects.objects>
        <property.show-objects hidden=true />
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);

    expect(compiledComponent.ngComponent)
      .toMatch('@Output()');
    expect(compiledComponent.ngComponent)
      .toMatch('new EventEmitter');
    expect(compiledComponent.ngComponent)
      .toMatch(/import .* EventEmitter .*/);
    expect(compiledComponent.ngComponent)
      .toMatch('emit');
  });

  it('should compile component with output expr', () => {
    const st: SymbolTable = {
      property: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="component-with-output-expr"
        objects$=property.show-objects.objects.length + 1>
        <property.show-objects hidden=true />
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);

    expect(compiledComponent.ngComponent)
      .toMatch('@Output()');
    expect(compiledComponent.ngComponent)
      .toMatch('emit');
    expect(compiledComponent.ngComponent)
      .toMatch(/\+ 1/);
    expect(compiledComponent.ngComponent)
      .toMatch('emit');
  });

  it('should compile component with output expr', () => {
    const st: SymbolTable = {
      property: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="component-with-output-expr"
        objects$=property.show-objects.objects.length + 1>
        <property.show-objects hidden=true />
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);

    expect(compiledComponent.ngComponent)
      .toMatch('@Output()');
    expect(compiledComponent.ngComponent)
      .toMatch('emit');
    expect(compiledComponent.ngComponent)
      .toMatch(/\+ 1/);
  });

  it('should compile component with input', () => {
    const st: SymbolTable = {
      property: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="component-with-input">
        <property.show-objects hidden=true object=$supply />
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);

    expect(compiledComponent.ngTemplate)
      .toMatch(/\[hidden]="true"/);
  });

  it('should compile component with component input', () => {
    const st: SymbolTable = {
      event: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="home">
        <event.choose-and-show-series
          showEvent=<event.show-event/>
          noEventsToShowText="No meetings to show"
          chooseSeriesSelectPlaceholder="Choose Meeting Series" />
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);
    expect(compiledComponent.ngTemplate)
      .toMatch(`[showEvent]`);
    expect(compiledComponent.ngTemplate)
      .toMatch(`tag`);
    expect(compiledComponent.ngTemplate)
      .toMatch(`type`);
    expect(compiledComponent.componentInputs.length)
      .toBe(1);
    expect(compiledComponent.componentInputs[0].ngTemplate)
      .toMatch(`show-event`);
  });

  /* TODO: fix the parsing bug exposed by this test.
      The component fails to parse when `assigneeId=...` appears first
  it('should compile component with component input with inputs', () => {
    const st: SymbolTable = {
      task: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="home">
        <${appName}.child-navbar />
        <task.show-tasks
          assigneeId=chorestar.child-navbar.user?.id
          noTasksToShowText="No uncompleted chores"
          completed=false
          showOptionToComplete=true
          showTask=<${appName}.show-chore chore=$task view="hello" /> />
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);
    expect(compiledComponent.ngTemplate)
      .toMatch(`[showTask]`);
    expect(compiledComponent.ngTemplate)
      .toMatch(`tag`);
    expect(compiledComponent.ngTemplate)
      .toMatch(`type`);
    expect(compiledComponent.componentInputs.length)
      .toBe(1);
    expect(compiledComponent.componentInputs[0].ngTemplate)
      .toMatch(`show-task`);
  }); */

  it('should compile component with html component input', () => {
    const st: SymbolTable = {
      event: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="home">
        <event.choose-and-show-series
          showEvent=<h1>Event</h1>
          noEventsToShowText="No meetings to show"
          chooseSeriesSelectPlaceholder="Choose Meeting Series" />
      </dv.component>
    `;
    const compiledComponent: CompiledComponent = componentCompiler
      .compile(appName, component, st);
    expect(compiledComponent.ngTemplate)
      .toMatch(`[showEvent]`);
    expect(compiledComponent.ngTemplate)
      .toMatch(`tag`);
    expect(compiledComponent.ngTemplate)
      .toMatch(`type`);
  });

  it('should compile app component with component input ' +
    'that uses context outputs', () => {
      const st: SymbolTable = {
        event: {
          kind: 'concept'
        },
        foo: {
          kind: 'concept'
        }
      };
      const component = `
      <dv.component name="home">
        <foo.component />
        <event.choose-and-show-series
          showEvent=
            <${appName}.show-group-meeting
              groupMeeting=foo.component.someValue />
          noEventsToShowText="No meetings to show"
          chooseSeriesSelectPlaceholder="Choose Meeting Series" />
      </dv.component>
    `;
      const compiledComponent: CompiledComponent = componentCompiler
        .compile(appName, component, st);
      expect(compiledComponent.ngTemplate)
        .toMatch(`[showEvent]`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`tag`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`type`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`inputs`);
      expect(compiledComponent.componentInputs.length)
        .toBe(1);
      const componentInput = compiledComponent.componentInputs[0];
      expect(componentInput.ngTemplate)
        .toMatch(`show-group-meeting`);
      const inputRegex = /@Input\(\)\s+(.*);/;
      expect(componentInput.ngComponent)
        .toMatch(inputRegex);

      const inputField = componentInput.ngComponent
        .match(inputRegex)[1];
      expect(componentInput.ngTemplate)
        .toMatch(inputField);

      const inputsObjRegex = new RegExp(
        `{\\s*${inputField}:\\s*([^}\\s]*)\\s*}`);

      expect(compiledComponent.ngTemplate)
        .toMatch(inputsObjRegex);

      const outputField = compiledComponent.ngTemplate
        .match(inputsObjRegex)[1];
      expect(compiledComponent.ngTemplate)
        .toMatch(new RegExp(`${outputField}\\s*=`));
      expect(compiledComponent.ngComponent)
        .toMatch(outputField);

      expect(compiledComponent.ngTemplate)
        .toMatch('capture__');
    });

  it('should compile concept component with component input ' +
    'that uses context outputs', () => {
      const st: SymbolTable = {
        scoring: {
          kind: 'concept'
        },
        foo: {
          kind: 'concept'
        }
      };
      const component = `
      <dv.component name="home">
        <foo.navbar />
        <div>
          <scoring.show-targets-by-score
            showTarget=<foo.show-post
            loggedInUser=foo.navbar.loggedInUser />
          >
          </scoring.show-targets-by-score>
        </div>
      </dv.component>`;
      const compiledComponent: CompiledComponent = componentCompiler
        .compile(appName, component, st);
      expect(compiledComponent.ngTemplate)
        .toMatch(`[showTarget]`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`tag`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`type`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`inputs`);
      expect(compiledComponent.componentInputs.length)
        .toBe(1);
      const componentInput = compiledComponent.componentInputs[0];
      expect(componentInput.ngTemplate)
        .toMatch(`show-post`);
      const inputRegex = /@Input\(\)\s+(.*);/;
      expect(componentInput.ngComponent)
        .toMatch(inputRegex);

      const inputField = componentInput.ngComponent
        .match(inputRegex)[1];
      expect(componentInput.ngTemplate)
        .toMatch(inputField);

      const inputsObjRegex = new RegExp(
        `{\\s*${inputField}:\\s*([^}\\s]*)\\s*}`);

      expect(compiledComponent.ngTemplate)
        .toMatch(inputsObjRegex);

      const outputField = compiledComponent.ngTemplate
        .match(inputsObjRegex)[1];
      expect(compiledComponent.ngTemplate)
        .toMatch(new RegExp(`${outputField}\\s*=`));
      expect(compiledComponent.ngComponent)
        .toMatch(outputField);

      expect(compiledComponent.ngTemplate)
        .toMatch('capture__');
    });

    it('should compile component with component input ' +
    'that uses context', () => {
      const st: SymbolTable = {
        scoring: {
          kind: 'concept'
        },
        foo: {
          kind: 'concept'
        }
      };
      const component = `
      <dv.component name="home">
        <foo.navbar />
        <div>
          <scoring.show-targets-by-score
            showTarget=<foo.show-post
            loggedInUser=foo.navbar.loggedInUser />
          >
          </scoring.show-targets-by-score>
        </div>
      </dv.component>`;
      const compiledComponent: CompiledComponent = componentCompiler
        .compile(appName, component, st);
      expect(compiledComponent.ngTemplate)
        .toMatch(`[showTarget]`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`tag`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`type`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`inputs`);
      expect(compiledComponent.componentInputs.length)
        .toBe(1);
      const componentInput = compiledComponent.componentInputs[0];
      expect(componentInput.ngTemplate)
        .toMatch(`show-post`);
      const inputRegex = /@Input\(\)\s+(.*);/;
      expect(componentInput.ngComponent)
        .toMatch(inputRegex);

      const inputField = componentInput.ngComponent
        .match(inputRegex)[1];
      expect(componentInput.ngTemplate)
        .toMatch(inputField);

      const inputsObjRegex = new RegExp(
        `{\\s*${inputField}:\\s*([^}\\s]*)\\s*}`);

      expect(compiledComponent.ngTemplate)
        .toMatch(inputsObjRegex);

      const outputField = compiledComponent.ngTemplate
        .match(inputsObjRegex)[1];
      expect(compiledComponent.ngTemplate)
        .toMatch(new RegExp(`${outputField}\\s*=`));
      expect(compiledComponent.ngComponent)
        .toMatch(outputField);

      expect(compiledComponent.ngTemplate)
        .toMatch('capture__');
    });

  it('should compile component with component input ' +
    'that captures context inputs with member access', () => {
      const st: SymbolTable = {
        scoring: {
          kind: 'concept'
        },
        foo: {
          kind: 'concept'
        }
      };
      const component = `
      <dv.component name="home">
        <foo.navbar id=$myId.id />
        <div>
          <scoring.show-targets-by-score
            showTarget=<div>
              <foo.other-navbar />
              <foo.create-post id=$myId.id user=foo.navbar.user />
            </div>
          />
        </div>
      </dv.component>`;
      const compiledComponent: CompiledComponent = componentCompiler
        .compile(appName, component, st);
      expect(compiledComponent.ngTemplate)
        .toMatch(/\[showTarget\]/);
      expect(compiledComponent.ngTemplate)
        .toMatch(`tag`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`type`);

      const inputsObjRegex = (inputField) => new RegExp(
        `${inputField}:\\s*([^}\\s]*)`);

      expect(compiledComponent.ngTemplate)
        .toMatch(inputsObjRegex(`capture__foo_navbar_user`));
      expect(compiledComponent.ngTemplate)
        .toMatch(inputsObjRegex(`capture__myId`));

      expect(compiledComponent.componentInputs.length)
        .toBe(1);
      const componentInput = compiledComponent.componentInputs[0];
      expect(componentInput.ngTemplate)
        .toMatch(`navbar`);
      expect(componentInput.ngTemplate)
        .toMatch(`create-post`);
      expect(componentInput.ngTemplate)
        .toMatch(/\[id\]="capture__myId.id"/);
      expect(componentInput.ngComponent)
        .toMatch(/@Input\(\) capture__myId;/);
  });

  it('should compile component with component input ' +
    'that captures context inputs', () => {
      const st: SymbolTable = {
        scoring: {
          kind: 'concept'
        },
        foo: {
          kind: 'concept'
        }
      };
      const component = `
      <dv.component name="home">
        <foo.navbar id=$myId />
        <div>
          <scoring.show-targets-by-score
            showTarget=<div><foo.create-post id=$myId /></div>
          />
        </div>
      </dv.component>`;
      const compiledComponent: CompiledComponent = componentCompiler
        .compile(appName, component, st);
      expect(compiledComponent.ngTemplate)
        .toMatch(/\[showTarget\]/);
      expect(compiledComponent.ngTemplate)
        .toMatch(`tag`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`type`);

      const inputsObjRegex = (inputField) => new RegExp(
        `${inputField}:\\s*([^}\\s]*)`);

      expect(compiledComponent.ngTemplate)
        .toMatch(inputsObjRegex(`capture__myId`));

      expect(compiledComponent.ngTemplate)
        .toMatch(/capture__myId:\s*myId\s*/);
      expect(compiledComponent.ngComponent)
        .toMatch(/@Input\(\) myId/);

      expect(compiledComponent.componentInputs.length)
        .toBe(1);
      const componentInput = compiledComponent.componentInputs[0];
      expect(componentInput.ngTemplate)
        .toMatch(`create-post`);
      expect(componentInput.ngTemplate)
        .toMatch(/\[id\]="capture__myId"/);
      expect(componentInput.ngComponent)
        .toMatch(/@Input\(\) capture__myId;/);
  });

  it('should compile component with component input ' +
    'that captures context inputs', () => {
      const st: SymbolTable = {
        scoring: {
          kind: 'concept'
        },
        foo: {
          kind: 'concept'
        }
      };
      const component = `
      <dv.component name="home">
        <foo.navbar id=$myId />
        <div>
          <scoring.show-targets-by-score
            showTarget=<${appName}.create-post id=$myId />
          />
        </div>
      </dv.component>`;
      const compiledComponent: CompiledComponent = componentCompiler
        .compile(appName, component, st);
      expect(compiledComponent.ngTemplate)
        .toMatch(/\[showTarget\]/);
      expect(compiledComponent.ngTemplate)
        .toMatch(`tag`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`type`);

      const inputsObjRegex = (inputField) => new RegExp(
        `${inputField}:\\s*([^}\\s]*)`);

      expect(compiledComponent.ngTemplate)
        .toMatch(inputsObjRegex(`capture__myId`));

      expect(compiledComponent.ngTemplate)
        .toMatch(/capture__myId:\s*myId\s*/);
      expect(compiledComponent.ngComponent)
        .toMatch(/@Input\(\) myId/);

      expect(compiledComponent.componentInputs.length)
        .toBe(1);
      const componentInput = compiledComponent.componentInputs[0];
      expect(componentInput.ngTemplate)
        .toMatch(`create-post`);
      expect(componentInput.ngTemplate)
        .toMatch(/\[id\]="capture__myId"/);
      expect(componentInput.ngComponent)
        .toMatch(/@Input\(\) capture__myId;/);
  });

  it('should compile component with component input ' +
    'that maps outputs', () => {
      const st: SymbolTable = {
        event: {
          kind: 'concept'
        }
      };
      const component = `
    <dv.component name="home">
      <event.choose-and-show-series
        showEvent=
          <dv.component
            meeting$=${appName}.show-group-meeting.shownGroupMeeting>
            <${appName}.show-group-meeting
              groupMeeting=$event
              groupMeetings=$events />
          </dv.component>
        noEventsToShowText="No meetings to show"
        chooseSeriesSelectPlaceholder="Choose Meeting Series" />
    </dv.component>
  `;

      const compiledComponent: CompiledComponent = componentCompiler
        .compile(appName, component, st);
      expect(compiledComponent.ngTemplate)
        .toMatch(`[showEvent]`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`tag`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`type`);
    });

  it('should compile component with component input that maps outputs ' +
    'where multiple components are from the same concept', () => {
      const st: SymbolTable = {
        event: {
          kind: 'concept'
        }
      };
      const component = `
    <dv.component name="home">
      <event.choose-and-show-series
        showEvent=
          <dv.component meeting$=event.show-events.fetchedEvents>
            <event.show-events />
          </dv.component>
        noEventsToShowText="No meetings to show"
        chooseSeriesSelectPlaceholder="Choose Meeting Series" />
    </dv.component>
  `;

      const compiledComponent: CompiledComponent = componentCompiler
        .compile(appName, component, st);
      expect(compiledComponent.ngTemplate)
        .toMatch(`[showEvent]`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`tag`);
      expect(compiledComponent.ngTemplate)
        .toMatch(`type`);
    });

  it('should compile component with an alias', () => {
    const st: SymbolTable = {
      property: {
        kind: 'concept'
      },
      foo: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="component-with-alias">
        <property.show-objects as prop hidden=true />
        <foo.show stuff=prop.objects />
      </dv.component>
    `;
    componentCompiler.compile(appName, component, st);
  });

  it('should fail if dv-tx is aliased', () => {
    const st: SymbolTable = {
      property: {
        kind: 'concept'
      },
      scoring: {
        kind: 'concept'
      }
    };
    const component = `
      <dv.component name="component-with-tx-alias">
        <dv.tx as foo>
          <property.create-object />
          <scoring.create-score />
        </dv.tx>
      </dv.component>
    `;
    expect(() => componentCompiler.compile(appName, component, st))
      .toThrow();
  });
});
