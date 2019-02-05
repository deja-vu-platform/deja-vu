import { AppCompiler } from './app.compiler';

import { dirSync } from 'tmp';

import { mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
// import * as rimraf from 'rimraf';


class Morg {
  static WriteTo(projectDir: string) {
    writeFileSync(path.join(projectDir, 'dvconfig.json'), Morg.DvConfig());
    const srcDir = path.join(projectDir, 'src');
    mkdirSync(srcDir);
    for (const action of Morg.Actions()) {
      writeFileSync(path.join(srcDir, `${action.name}.html`), action.contents);
    }
  }

  private static DvConfig(): string {
    return `
      {
        "name": "morg",
        "gateway": {
          "config": {
            "wsPort": 3000
          }
        },
        "usedCliches": {
          "event": {
            "name": "event",
            "config": {
              "wsPort": 3002
            }
          },
          "allocator": {
            "name": "allocator",
            "config": {
              "wsPort": 3003
            }
          },
          "property": {
            "name": "property",
            "config": {
              "wsPort": 3004,
              "initialObjects": [{"name": "Ben"}, {"name": "Alyssa"}],
              "schema": {
                "title": "Party",
                "type": "object",
                "properties": {
                    "name": {
                      "type": "string"
                    }
                },
                "required": ["name"]
              }
            }
          }
        },
        "routes": [
          { "path": "", "action": "morg-home" }
        ]
      }
    `;
  }

  private static Actions(): { name: string, contents: string }[] {
    return [
      { name: 'home', contents: `
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
                      <dv.ids for=event.create-weekly-series.seriesEvents />
                      <event.create-weekly-series
                        save=false
                        showOptionToSubmit=false />
                      <event.create-series
                        id=dv.id.id
                        hidden=true
                        seriesEvents=event.create-weekly-series.seriesEvents
                        seriesEventsIds=dv.ids.ids />
                      <allocator.create-allocation hidden=true
                        id=dv.id.id
                        resourceIds=dv.ids.ids
                        consumerIds=property.show-objects.objectIds />
                      <dv.button>Create Group Meeting Series</dv.button>
                    </dv.tx>
                </div>
                <div class="row box">
                    <div class="col-md-12">
                      <event.choose-and-show-series
                        showEvent=<
                          morg.show-group-meeting
                          groupMeeting=$event groupMeetings=$events />
                        noEventsToShowText="No meetings to show"
                        chooseSeriesSelectPlaceholder="Choose Meeting Series" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </dv.action>
      `},
      { name: 'show-group-meeting', contents: `
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
                <allocator.delete-resource resourceId=$groupMeeting.id
                  allocationId=$groupMeeting.seriesId hidden=true />
              </dv.tx>
            </div>
          </div>
        </dv.action>
      `}
    ];
  }
}

describe('AppCompiler', () => {
  let projectDir, outputDir;

  beforeAll(() => {
    projectDir = dirSync({ prefix: 'dvTestsSrc_' });
    Morg.WriteTo(projectDir.name);
    outputDir = dirSync({ prefix: 'dvTestsOutput_' });
    console.log(`source dir: ${projectDir.name}, dst dir: ${outputDir.name}`);
    AppCompiler.Compile(projectDir.name, outputDir.name, false);
  });

  afterAll(() => {
    /*
    rimraf.sync(projectDir.name);
    rimraf.sync(outputDir.name); */
  });

  it('should generate package.json', () => {
  });

  it('should generate index.html', () => {
  });

  it('should generate a component per action', () => {
  });
});

