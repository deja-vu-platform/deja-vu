import { ActionCompiler } from './actionCompiler';

describe('ActionCompiler', () => {
  let actionCompiler: ActionCompiler;
  const appName = 'app';

  beforeEach(() => {
    actionCompiler = new ActionCompiler();
  });

  it('should compile action with HTML only', () => {
    const action = `
      <dv.action name="action-with-html-only">
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
    actionCompiler.compile(appName, action, {});
  });

  it('should compile action with actions', () => {
    const action =  `
      <dv.action name="home">
        <div class="container main">
          <div class="row">
            <div class="col-md-12">
              <div class="row">
                <div class="col-md-12">
                  <h1>Group meeting organizer</h1>
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
    actionCompiler.compile(appName, action, {});
  });

  it('should compile action with inputs', () => {
    const action = `
      <dv.action name="show-group-meeting">
        <div class="row">
          <div class="col-md-6">
            <event.show-event event=$groupMeeting />
          </div>
          <div class="col-md-4">
            <dv.tx>
              <property.choose-object
                chooseObjectSelectPlaceholder="Champion"
                initialObjectId=allocator.edit-consumer.currentConsumerId />
              <allocator.edit-consumer hidden=true
                resourceId=$groupMeeting.id
                allocationId=$groupMeeting.seriesId
                newConsumerId=property.choose-object.selectedObjectId />
            </dv.tx>
          </div>
          <div class="col-md-2">
            <dv.tx>
              <event.delete-event id=$groupMeeting.id events=$groupMeetings />
              <allocator.delete-resource
                resourceId=$groupMeeting.id
                allocationId=$groupMeeting.seriesId
                hidden=true />
            </dv.tx>
          </div>
        </div>
      </dv.action>
    `;
    actionCompiler.compile(appName, action, {});
  });

  it('should compile action with outputs', () => {
    const action = `
      <dv.action name="action-with-outputs" objects$=property.show-objects.objects>
        <property.show-objects hidden=true />
      </dv.action>
    `;
    actionCompiler.compile(appName, action, {});
  });

  it('should compile action with action input', () => {
    const action = `
      <dv.action name="home">
        <div class="row box">
          <div class="col-md-12">
            <event.choose-and-show-series
              showEvent=
                <dv.action>
                  <morg.show-group-meeting
                    groupMeeting=$event
                    groupMeetings=$events />
                </dv.action>
              noEventsToShowText="No meetings to show"
              chooseSeriesSelectPlaceholder="Choose Meeting Series" />
          </div>
        </div>
      </dv.action>
    `;
    actionCompiler.compile(appName, action, {});
  });

  it('should compile action with an alias', () => {
    const action = `
      <dv.action name="action-with-alias"
        objects$=property.show-objects.objects>
        <property.show-objects as prop hidden=true />
      </dv.action>
    `;
    actionCompiler.compile(appName, action, {});
  });
});
