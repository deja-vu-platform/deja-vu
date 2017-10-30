import { generateId } from '../../utility/utility';
import { Widget } from '../widget/widget';
import { Meta } from '../project/project';

export enum ClicheType {
  USER_CLICHE, DV_CLICHE
}

export abstract class Cliche {
  // A cliche contains the actual widget objects
  protected objectType = 'Cliche';
  protected meta: Meta;
  protected widgets: Map<string, Map<string, Widget>>;
  protected clicheType: ClicheType;

  /**
   * Converts a JSON object to a Widget object
   * @param object object to convert
   */
  static fromObject(object: any): UserCliche | DvCliche {
    const notCorrectObject = 'Object is not an instance of a Cliche';
    if (object.clicheType === undefined || object.clicheType === null) {
        throw Error(notCorrectObject);
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
      uc.addPage(Widget.fromObject(object.widgets.pages[widgetId]));
    }
    for (const widgetId of Object.keys(object.widgets.used)){
      uc.addUsedWidget(Widget.fromObject(object.widgets.used[widgetId]));
    }
    for (const widgetId of Object.keys(object.widgets.unused)){
      uc.addUnusedWidget(Widget.fromObject(object.widgets.unused[widgetId]));
    }
    for (const widgetId of Object.keys(object.widgets.templates)){
      uc.addTemplate(Widget.fromObject(object.widgets.templates[widgetId]));
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
    this.widgets = new Map<string, Map<string, Widget>>();
    this.widgets.set('pages', new Map<string, Widget>());
    this.widgets.set('used', new Map<string, Widget>());
    this.widgets.set('unused', new Map<string, Widget>());
    this.widgets.set('templates', new Map<string, Widget>());
  }

  getId (): string {
    return this.meta.id;
  }

  isPage (widgetId: string): boolean {
    return widgetId in this.widgets.get('pages');
  }

  addPage (widget: Widget) {
    this.widgets.get('pages').set(widget.getId(), widget);
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

  addTemplate (widget: Widget) {
    this.widgets.get('templates').set(widget.getId(), widget);
  }

  removeTemplate = function(widgetId){
    this.widgets.get('templates').delete(widgetId);
  };

  getTemplateIds (): string[] {
    return Array.from(this.widgets.get('templates').keys());
  }

  addUnusedWidget (widget: Widget) {
    this.widgets.get('unused').set(widget.getId(), widget);
  }

  removeUnusedWidget = function(widgetId){
    this.widgets.get('unused').delete(widgetId);
  };

  getUnusedWidgetIds (): string[] {
    return  Array.from(this.widgets.get('used').keys());
  }

  addUsedWidget (widget: Widget) {
    this.widgets.get('used').set(widget.getId(), widget);
  }

  removeUsedWidget = function(widgetId){
    this.widgets.get('used').delete(widgetId);
  };

  getUsedWidgetIds (): string[] {
    return  Array.from(this.widgets.get('used').keys());
  }
}

export class DvCliche extends Cliche {

  constructor () {
    super();
    this.clicheType = ClicheType.DV_CLICHE;
    this.widgets = new Map<string, Map<string, Widget>>();
    this.widgets.set('templates', new Map<string, Widget>());
  }
}
