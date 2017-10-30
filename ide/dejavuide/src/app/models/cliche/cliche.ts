import { generateId } from '../../utility/utility';
import { Widget } from '../widget/widget';
import { Meta } from '../project/project';

export enum ClicheType {
  USER_CLICHE, DV_CLICHE
}

enum WidgetGroup {
  PAGE, TEMPLATE, USED, UNUSED
}

export abstract class Cliche {
  // A cliche contains the actual widget objects
  protected objectType = 'Cliche';
  protected meta: Meta;
  protected widgets: Map<WidgetGroup, Map<string, Widget>>;
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
    const toAdds: Function[] = [
      uc.addPage,
      uc.addUsedWidget,
      uc.addUnusedWidget,
      uc.addTemplate];

    const orderedGroups: WidgetGroup[] = [
      WidgetGroup.PAGE,
      WidgetGroup.USED,
      WidgetGroup.UNUSED,
      WidgetGroup.TEMPLATE];

    orderedGroups.forEach((group, i) => {
      for (const widgetId of Object.keys(object.widgets[group])){
        toAdds[i](Widget.fromObject(object.widgets[group][widgetId]));
      }
    });
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
    this.widgets = new Map<WidgetGroup, Map<string, Widget>>();
    this.widgets.set(WidgetGroup.PAGE, new Map<string, Widget>());
    this.widgets.set(WidgetGroup.USED, new Map<string, Widget>());
    this.widgets.set(WidgetGroup.UNUSED, new Map<string, Widget>());
    this.widgets.set(WidgetGroup.TEMPLATE, new Map<string, Widget>());
  }

  getId (): string {
    return this.meta.id;
  }

  isPage (widgetId: string): boolean {
    return widgetId in this.widgets.get(WidgetGroup.PAGE);
  }

  addPage (widget: Widget) {
    this.widgets.get(WidgetGroup.PAGE).set(widget.getId(), widget);
  }

  /**
   * Just removes the page from the cliche object, does not delete the widget
   * object itself.
   */
  removePage (widgetId: string) {
    this.widgets.get(WidgetGroup.PAGE).delete(widgetId);
  }

  getPage (widgetId: string): Widget {
    return this.widgets.get(WidgetGroup.PAGE).get(widgetId);
  }

  getPageIds (): string[] {
    return  Array.from(this.widgets.get(WidgetGroup.PAGE).keys());
  }

  addTemplate (widget: Widget) {
    this.widgets.get(WidgetGroup.TEMPLATE).set(widget.getId(), widget);
  }

  removeTemplate (widgetId: string) {
    this.widgets.get(WidgetGroup.TEMPLATE).delete(widgetId);
  }

  getTemplate (widgetId: string): Widget {
    return this.widgets.get(WidgetGroup.TEMPLATE).get(widgetId);
  }

  getTemplateIds (): string[] {
    return Array.from(this.widgets.get(WidgetGroup.TEMPLATE).keys());
  }

  addUnusedWidget (widget: Widget) {
    this.widgets.get(WidgetGroup.UNUSED).set(widget.getId(), widget);
  }

  removeUnusedWidget(widgetId: string) {
    this.widgets.get(WidgetGroup.UNUSED).delete(widgetId);
  }

  getUnusedWidget (widgetId: string): Widget {
    return this.widgets.get(WidgetGroup.UNUSED).get(widgetId);
  }

  getUnusedWidgetIds (): string[] {
    return  Array.from(this.widgets.get(WidgetGroup.UNUSED).keys());
  }

  addUsedWidget (widget: Widget) {
    this.widgets.get(WidgetGroup.USED).set(widget.getId(), widget);
  }

  removeUsedWidget (widgetId: string) {
    this.widgets.get(WidgetGroup.USED).delete(widgetId);
  }

  getUsedWidget (widgetId: string): Widget {
    return this.widgets.get(WidgetGroup.USED).get(widgetId);
  }

  getUsedWidgetIds (): string[] {
    return  Array.from(this.widgets.get(WidgetGroup.USED).keys());
  }

  getWidget(widgetId: string): Widget {
    if (widgetId in this.widgets.get(WidgetGroup.PAGE)) {
      return this.getPage(widgetId);
    }

    if (widgetId in this.widgets.get(WidgetGroup.USED)) {
      return this.getUsedWidget(widgetId);
    }

    if (widgetId in this.widgets.get(WidgetGroup.UNUSED)) {
      return this.getUnusedWidget(widgetId);
    }

    if (widgetId in this.widgets.get(WidgetGroup.TEMPLATE)) {
      return this.getTemplate(widgetId);
    }
    return undefined;
  }

  removeWidget(widgetId: string) {
    if (widgetId in this.widgets.get(WidgetGroup.PAGE)) {
      this.removePage(widgetId);
    }

    if (widgetId in this.widgets.get(WidgetGroup.USED)) {
      return this.removeUsedWidget(widgetId);
    }

    if (widgetId in this.widgets.get(WidgetGroup.UNUSED)) {
      return this.removeUnusedWidget(widgetId);
    }

    if (widgetId in this.widgets.get(WidgetGroup.TEMPLATE)) {
      return this.removeTemplate(widgetId);
    }
  }
}

export class DvCliche extends Cliche {

  constructor () {
    super();
    this.clicheType = ClicheType.DV_CLICHE;
    this.widgets = new Map<WidgetGroup, Map<string, Widget>>();
    this.widgets.set(WidgetGroup.TEMPLATE, new Map<string, Widget>());
  }
}
