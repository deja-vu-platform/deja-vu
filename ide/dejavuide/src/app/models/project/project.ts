import { generateId } from '../../utility/utility';
import { Cliche, UserCliche, DvCliche} from '../cliche/cliche';
import { Widget } from '../widget/widget';
/**
 * A map from clicheIds to all cliches
 */
type ClicheMap = Map<string, Cliche>;

export interface Meta {
  name: string;
  id: string;
  version?: string;
  author?: string;
  templateId?: string;
  clicheId?: string;
}

export class Project {
  objectType = 'Project';
  meta: Meta;
  userApp: UserCliche = null;
  importedCliches = new Map<string, DvCliche>();
  lastAccessed = -Infinity;

  static fromObject (object: any): Project {
    // TODO (https://github.com/spderosso/dejavu/issues/117)
    // loading is broken due to circular dependencies

    const notCorrectObject = 'Object is not an instance of a Project';
    if (object.objectType !== 'Project') {
      throw Error(notCorrectObject);
    }
    const project = new Project(object.meta.name, true);
    project.meta.id = object.meta.id;
    project.userApp = UserCliche.fromObject(project, object.userApp);

    for (const clicheId of Object.keys(object.importedCliches)) {
        project.importCliche(clicheId);
    }
    return project;
  }

  constructor (name, fromObject = false) {
    this.meta = {
      name: name,
      id: generateId(),
      version: '',
      author: ''
    };

    this.lastAccessed = (new Date()).getTime();
    if (!fromObject) {
      this.userApp = new UserCliche(this, this.meta.name);
    }
  }

  getName(): string {
    return this.meta.name;
  }

  importCliche (clicheId) {
    // TODO figure out how importing works
    this.importedCliches.set(clicheId, null);
  }

  removeImportedCliche (clicheId) {
      this.importedCliches.delete(clicheId);
  }

  getUserApp () {
    return this.userApp;
  }

  updateAccess() {
    this.lastAccessed = (new Date()).getTime();
  }

  getLastAccessed() {
    return this.lastAccessed;
  }

  /**
   * Given a map of clicheIds to all their widgets, adds a widget to that map.
   * @param allCliches a map of clicheids to cliches
   * @param widget widget to add
   */
  addAppWidget(widget: Widget) {
    if (widget.getClicheId() !== this.userApp.getId()) {
      throw new Error('Not a user application widget!');
    }
    this.userApp.addUnusedWidget(widget);
  }

  /**
     * Given a widgetId, gets the widget object from the user application
     * @param widgetId id of widget to find
     */
  getAppWidget(widgetId: string): Widget {
    const clicheid = Widget.decodeid(widgetId)[0];
    if (clicheid !== this.userApp.getId()) {
      throw new Error('Not a user application widget!');
    }
    const widget = this.userApp.getWidget(widgetId);
    if (!widget) {
      throw new Error('Widget not found in user app');
    }
    return widget;
  }

  /**
     * Just deletes from the user application and the template reference if
     * it has one. Doesn't touch inner widgets if any.
     */
  removeWidget(widgetId: string, templateId?: string) {
      if (templateId) {
          this.getAppWidget(templateId).removeTemplateCopy(widgetId);
      }
      this.userApp.removeWidget(widgetId);
  }

  getSaveableJson() {
    const json: Project = Object.assign({}, this);
    json.userApp = this.userApp.getSaveableJson();
    json.importedCliches.forEach((cliche, clicheId) => {
      // TODO
      // make sure to create a copy and not overwrite anything in this
    });
    return JSON.parse(JSON.stringify(json));
  }
}
