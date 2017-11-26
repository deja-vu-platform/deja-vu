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
  userApp = null;
  importedCliches = new Map<string, DvCliche>();
  lastAccessed = -Infinity;

  static fromObject (object: any): Project {
    const notCorrectObject = 'Object is not an instance of a Project';
    if (object.objectType !== 'Project') {
      throw Error(notCorrectObject);
    }
    const project = new Project(object.meta.name);
    if (object.userApp) {
      project.userApp = UserCliche.fromObject(project, object.userApp);
    }

    for (const clicheId of Object.keys(object.importedCliches)) {
        project.importCliche(clicheId);
    }
    return project;
  }

  constructor (name) {
    this.meta = {
      name: name,
      id: generateId(),
      version: '',
      author: ''
    };

    this.lastAccessed = (new Date()).getTime();
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

  newUserApp () {
    if (this.userApp != null) {
      throw new Error('There is already a user app associated with this project');
    }
    this.userApp = new UserCliche(this, this.meta.name);
    return this.userApp;
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
      throw Error('Not a user application widget!');
    }
    // TODO add checks in userapp so that we aren't adding duplicate widgets
    this.userApp.addUnusedWidget(widget);
  }

  /**
     * Given a widgetId, gets the widget object from the user application
     * @param widgetId id of widget to find
     */
  getAppWidget(widgetId: string): Widget {
    const clicheid = Widget.decodeid(widgetId)[0];
    if (clicheid !== this.userApp.getId()) {
      throw Error('Not a user application widget!');
    }
    const widget = this.userApp.getWidget(widgetId);
    if (!widget) {
      throw Error('Widget not found in widgetId');
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
}
