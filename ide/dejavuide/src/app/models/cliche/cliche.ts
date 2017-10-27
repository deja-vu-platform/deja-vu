import { generateId } from '../../utility/utility';
import { Widget } from '../widget/widget';

export enum ClicheType {
  USER_CLICHE, DV_CLICHE
}

interface Meta {
  name: string;
  id: string; // id of the form 'clicheid'
  version?: string;
  author?: string;
}

export abstract class Cliche {
  protected meta: Meta;
  protected widgets: Map<string, Set<string>>;
  protected clicheType: ClicheType;

    /**
   * Converts a JSON object to a Widget object
   * @param object object to convert
   */
  static fromObject(object: any): UserCliche | DvCliche {
    const notCorrectObjectError = 'notCorrectObjectError: ' +
    'object object is not an instance of a Cliche';
    if (object.clicheType === undefined || object.clicheType === null) {
        throw notCorrectObjectError;
    }
    if (object.clicheType === ClicheType.USER_CLICHE) {
        return UserCliche.fromObject(object);
    }
    return DvCliche.fromObject(object);
  }
}

export class UserCliche extends Cliche {
  static fromObject(object: any) {
    if (object.clicheType !== ClicheType.USER_CLICHE) {
      return null;
    }
    const uc = new UserCliche(object.meta.name);
    for (const widgetId of Object.keys(object.widgets.pages)){
      uc.addPage(widgetId);
    }
    for (const widgetId of Object.keys(object.widgets.unused)){
      uc.addUnusedWidget(widgetId);
    }
    for (const widgetId of Object.keys(object.widgets.templates)){
      uc.addTemplate(widgetId);
    }
    return uc;
  }

  constructor (name) {
    super();
    this.clicheType = ClicheType.USER_CLICHE;
    this.meta = {
      name: name,
      id: generateId(),
      version: '',
      author: ''
    };
    this.widgets = new Map<string, Set<string>>();
    this.widgets.set('pages', new Set<string>());
    this.widgets.set('unused', new Set<string>());
    this.widgets.set('templates', new Set<string>());
  }

  getId (): string {
    return this.meta.id;
  }

  isPage (widgetId: string): boolean {
    return widgetId in this.widgets['pages'];
  }

  addPage (widgetId: string) {
    this.widgets.get('pages').add(widgetId);
  }

  /**
   * Just removes the page from the cliche object, does not delete the widget
   * object itself.
   */
  removePage (widgetId) {
    this.widgets.get('pages').delete(widgetId);
  }

  getPageIds (): string[] {
    return  Array.from(this.widgets.get('pages').keys());
  }

  addTemplate (widgetId) {
    this.widgets.get('templates').add(widgetId);
  }

  removeTemplate = function(widgetId){
    this.widgets.get('templates').delete(widgetId);
  };

  getTemplateIds (): string[] {
    return Array.from(this.widgets.get('templates').keys());
  }

  /**
  * makes a new unused widget
  * @param widget
  */
  addUnusedWidget (widgetId) {
    this.widgets.get('unused').add(widgetId);
  }

  removeUnusedWidget = function(widgetId){
    this.widgets.get('unused').delete(widgetId);
  };

  getUnusedWidgetIds (): string[] {
    return  Array.from(this.widgets.get('unused').keys());
  }
}

export class DvCliche extends Cliche {

  constructor () {
    super();
    this.clicheType = ClicheType.DV_CLICHE;
    this.widgets = new Map<string, Set<string>>();
    this.widgets.set('templates', new Set<string>());
  }
}
