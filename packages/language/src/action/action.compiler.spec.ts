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
          <input type="button" class="button">Click</button>
        </div>
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});
    expect(compiledAction.ngTemplate)
      .toMatch('Hello');
    expect(compiledAction.ngTemplate)
      .not.toMatch('dv.action');
    expect(compiledAction.ngComponent)
      .toMatch(`selector: "${appName}-action-with-html-only"`);
  });

  it('should compile action with actions', () => {
    const heading = 'Group meeting organizer';
    const action =  `
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
                    <dv.id />
                    <dv.status savedText="New group meeting series saved" />
                    <dv.ids for=event.create-weekly-series.events />
                    <event.create-weekly-series
                      save=false
                      showOptionToSubmit=false />
                    <event.create-series
                      id=dv.id.id
                      hidden=true
                      seriesEvents=event.create-weekly-series.events
                      seriesEventsIds=dv.ids.ids />
                    <allocator.create-allocation hidden=true
                      id=dv.id.id
                      resourceIds=dv.ids.ids
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
      .compile(appName, action, {});
    expect(compiledAction.ngTemplate)
      .toMatch(heading);
    expect(compiledAction.ngTemplate)
      .not.toMatch('dv.action');
  });

  it('should compile action accessing member of output', () => {
    const action = `
      <dv.action name="show-group-meeting">
        <property.choose-object
          chooseObjectSelectPlaceholder="Champion"
          initialObjectId=allocator.edit-consumer.currentConsumer.id />
        <allocator.edit-consumer hidden=true />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});
    expect(compiledAction.ngTemplate)
      .toMatch(/\(currentConsumer\)=".+=\$event"/);
    const outputField = compiledAction.ngTemplate
      .match(/\(currentConsumer\)="(.+)=\$event"/)[1];
    expect(compiledAction.ngComponent)
      .toMatch(outputField);
  });

  it('should compile action with output', () => {
    const action = `
      <dv.action name="action-with-outputs" objects$=property.show-objects.objects>
        <property.show-objects hidden=true />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});

    expect(compiledAction.ngComponent)
      .toMatch('@Output()');
    expect(compiledAction.ngComponent)
      .toMatch('emit');
  });

  it('should compile action with output expr', () => {
    const action = `
      <dv.action name="action-with-output-expr"
        objects$=property.show-objects.objects.length + 1>
        <property.show-objects hidden=true />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});

    expect(compiledAction.ngComponent)
      .toMatch('@Output()');
    expect(compiledAction.ngComponent)
      .toMatch('emit');
    expect(compiledAction.ngComponent)
      .toMatch(/\+ 1/);
  });

  it('should compile action with input', () => {
    const action = `
      <dv.action name="action-with-input">
        <property.show-objects hidden=true object=$supply />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});

    expect(compiledAction.ngTemplate)
      .toMatch(/\[hidden]="true"/);
  });

  it('should compile action with action input', () => {
    const action = `
      <dv.action name="home">
        <event.choose-and-show-series
          showEvent=<event.show-event/>
          noEventsToShowText="No meetings to show"
          chooseSeriesSelectPlaceholder="Choose Meeting Series" />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});
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

  it('should compile action with html action input', () => {
    const action = `
      <dv.action name="home">
        <event.choose-and-show-series
          showEvent=<h1>Event</h1>
          noEventsToShowText="No meetings to show"
          chooseSeriesSelectPlaceholder="Choose Meeting Series" />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});
    expect(compiledAction.ngTemplate)
      .toMatch(`[showEvent]`);
    expect(compiledAction.ngTemplate)
      .toMatch(`tag`);
    expect(compiledAction.ngTemplate)
      .toMatch(`type`);
  });

  it('should compile action with action input ' +
    'that uses context inputs', () => {
    const action = `
      <dv.action name="home">
        <foo.action />
        <event.choose-and-show-series
          showEvent=
            <morg.show-group-meeting
              groupMeeting=foo.action.someValue />
          noEventsToShowText="No meetings to show"
          chooseSeriesSelectPlaceholder="Choose Meeting Series" />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});
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

    const inputsObjRegex = new RegExp(`{\\s*"${inputField}":\\s*([^}\\s]*)\\s*}`);

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
    'that uses context inputs', () => {
    const action = `
      <dv.action name="home">
        <foo.navbar />
        <div>
          <scoringposts.show-targets-by-score
            showTarget=<foo.show-post
            loggedInUser=foo.navbar.loggedInUser />
          >
          </scoringposts.show-targets-by-score>
        </div>
      </dv.action>`;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});
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

    const inputsObjRegex = new RegExp(`{\\s*"${inputField}":\\s*([^}\\s]*)\\s*}`);

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
    'that shadows context inputs', () => {
    const action = `
      <dv.action name="home">
        <foo.navbar />
        <div>
          <scoringposts.show-targets-by-score
            showTarget=<div>
              <foo.navbar />
              <foo.show-post
               loggedInUser=foo.navbar.loggedInUser />
               </div>
          >
          </scoringposts.show-targets-by-score>
        </div>
      </dv.action>`;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});
    expect(compiledAction.ngTemplate)
      .toMatch(`[showTarget]`);
    expect(compiledAction.ngTemplate)
      .toMatch(`tag`);
    expect(compiledAction.ngTemplate)
      .toMatch(`type`);
    expect(compiledAction.actionInputs.length)
      .toBe(1);
    const actionInput = compiledAction.actionInputs[0];
    expect(actionInput.ngTemplate)
      .toMatch(`navbar`);
    expect(actionInput.ngTemplate)
      .toMatch(`show-post`);
    expect(actionInput.ngComponent)
      .not.toMatch('@Input()');

    expect(compiledAction.ngTemplate)
      .not.toMatch('capture__');
  });

  it('should compile action with action input ' +
    'that maps outputs', () => {
    const action = `
      <dv.action name="home">
        <event.choose-and-show-series
          showEvent=
            <dv.action meeting$=morg.show-group-meeting.shownGroupMeeting>
              <morg.show-group-meeting
                groupMeeting=$event
                groupMeetings=$events />
            </dv.action>
          noEventsToShowText="No meetings to show"
          chooseSeriesSelectPlaceholder="Choose Meeting Series" />
      </dv.action>
    `;
    const compiledAction: CompiledAction = actionCompiler
      .compile(appName, action, {});
    expect(compiledAction.ngTemplate)
      .toMatch(`[showEvent]`);
    expect(compiledAction.ngTemplate)
      .toMatch(`tag`);
    expect(compiledAction.ngTemplate)
      .toMatch(`type`);
  });

  it('should compile action with an alias', () => {
    const action = `
      <dv.action name="action-with-alias">
        <property.show-objects as prop hidden=true />
        <foo.show stuff=prop.objects />
      </dv.action>
    `;
    actionCompiler.compile(appName, action, {});
  });
});
