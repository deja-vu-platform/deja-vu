import { AppCompiler } from './app.compiler';

import { dirSync } from 'tmp';

import { mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
// import * as rimraf from 'rimraf';


class Morg {
  static WriteTo(projectDir: string) {
    writeFileSync(path.join(projectDir, 'dvconfig.json'), Morg.DvConfig());
    writeFileSync(path.join(projectDir, 'package.json'), Morg.PackageJson());
    const srcDir = path.join(projectDir, 'src');
    mkdirSync(srcDir);
    for (const component of Morg.Components()) {
      writeFileSync(
        path.join(srcDir, `${component.name}.html`), component.contents);
    }
  }

  private static PackageJson(): string {
    return `
      {
        "name": "my-sample-morg",
        "version": "0.0.1",
        "scripts": {
          "start": "dv serve",
          "clean": "rm -rf .dv"
        },
        "devDependencies": {
          "@deja-vu/cli": "^0.0.1"
        },
        "repository": "github:spderosso/dejavu",
        "license": "MIT",
        "bugs": {
          "url": "https://github.com/spderosso/dejavu/issues"
        },
        "homepage": "https://github.com/spderosso/dejavu#readme"
      }
    `;
  }

  private static DvConfig(): string {
    return `
      {
        "name": "morg",
        "type": "app",
        "usedConcepts": {
          "event": { },
          "allocator": { },
          "property": {
            "name": "property",
            "config": {
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
          { "path": "", "component": "home" }
        ]
      }
    `;
  }

  private static Components(): { name: string, contents: string }[] {
    return [
      { name: 'home', contents: `
        <dv.component name="home">
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
                      <dv.gen-id />
                      <dv.status savedText="New group meeting series saved" />
                      <dv.gen-ids for=event.create-weekly-series.seriesEvents />
                      <event.create-weekly-series
                        save=false
                        showOptionToSubmit=false />
                      <event.create-series
                        id=dv.gen-id.id
                        hidden=true
                        seriesEvents=event.create-weekly-series.seriesEvents
                        seriesEventsIds=dv.gen-ids.ids />
                      <allocator.create-allocation hidden=true
                        id=dv.gen-id.id
                        resourceIds=dv.gen-ids.ids
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
        </dv.component>
      `},
      { name: 'show-group-meeting', contents: `
        <dv.component name="show-group-meeting">
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
        </dv.component>
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

  it('should generate an ng-component per component', () => {
  });
});
