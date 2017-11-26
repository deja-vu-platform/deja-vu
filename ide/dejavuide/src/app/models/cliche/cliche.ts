import { generateId } from '../../utility/utility';
import { Widget } from '../widget/widget';
import { Project, Meta } from '../project/project';

export enum ClicheType {
  USER_CLICHE, DV_CLICHE
}

enum WidgetGroup {
  PAGE, TEMPLATE, USED, UNUSED
}

const orderedGroups: WidgetGroup[] = [
  WidgetGroup.PAGE,
  WidgetGroup.USED,
  WidgetGroup.UNUSED,
  WidgetGroup.TEMPLATE];

  export abstract class Cliche {
  // A cliche contains the actual widget objects
  protected objectType = 'Cliche';
  protected meta: Meta;
  protected widgets: Map<WidgetGroup, Map<string, Widget>>;
  protected clicheType: ClicheType;
  protected project: Project;

  /**
   * Converts a JSON object to a Widget object
   * @param object object to convert
   */
  static fromObject(project: Project, object: any): UserCliche | DvCliche {
    const notCorrectObject = 'Object is not an instance of a Cliche';
    if (object.clicheType === undefined || object.clicheType === null) {
        throw Error(notCorrectObject);
    }
    if (object.clicheType === ClicheType.USER_CLICHE) {
        return UserCliche.fromObject(project, object);
    }
    return DvCliche.fromObject(project, object);
  }

  constructor (project: Project) {
    this.project = project;
  }

  abstract getWidget(widgetId: string): Widget;

  getName(): string {
    return this.meta.name;
  }

  getId(): string {
    return this.meta.id;
  }
}

export class UserCliche extends Cliche {
  static fromObject(project: Project, object: any) {
    if (object.clicheType !== ClicheType.USER_CLICHE) {
      return null;
    }
    const uc = new UserCliche(project, object.meta.name);
    const toAdds: Function[] = [
      uc.addPage,
      uc.addUsedWidget,
      uc.addUnusedWidget,
      uc.addTemplate];

    orderedGroups.forEach((group, i) => {
      if (object.widgets[group]) {
        for (const widgetId of Object.keys(object.widgets[group])){
          toAdds[i](Widget.fromObject(project, object.widgets[group][widgetId]));
        }
      }
    });
    return uc;
  }

  constructor (project: Project, name) {
    super(project);
    this.clicheType = ClicheType.USER_CLICHE;
    this.meta = {
      name: name,
      id: generateId(),
      version: '',
      author: ''
    };
    this.widgets = new Map([
      [WidgetGroup.PAGE, new Map<string, Widget>()],
      [WidgetGroup.USED, new Map<string, Widget>()],
      [WidgetGroup.UNUSED, new Map<string, Widget>()],
      [WidgetGroup.TEMPLATE, new Map<string, Widget>()]
    ]);
  }

  isPage (widgetId: string): boolean {
    return widgetId in this.widgets.get(WidgetGroup.PAGE);
  }

  addPage (widget: Widget) {
    this.widgets.get(WidgetGroup.PAGE).set(widget.getId(), widget);
    this.widgets.get(WidgetGroup.UNUSED).delete(widget.getId());
    // TODO add inner widgets as used widgets
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
    return this.getPage(widgetId) ||
      this.getUsedWidget(widgetId) ||
        this.getUnusedWidget(widgetId) ||
          this.getTemplate(widgetId);
  }

  removeWidget(widgetId: string) {
      this.removePage(widgetId);
      this.removeUsedWidget(widgetId);
      this.removeUnusedWidget(widgetId);
      this.removeTemplate(widgetId);
  }

  getSaveableJson() {
    const json: UserCliche = Object.assign({}, this);
    delete json.project;

    orderedGroups.forEach((group, i) => {
      const widgetMap = this.widgets.get(group);
      if (widgetMap) {
        widgetMap.forEach((widget, widgetId) => {
          widgetMap.set(widgetId, widget.getSaveableJson());
        });
      }
    });
    return json;
  }
}

export class DvCliche extends Cliche {

  constructor (project: Project) {
    super(project);
    this.clicheType = ClicheType.DV_CLICHE;
    this.widgets = new Map<WidgetGroup, Map<string, Widget>>();
    this.widgets.set(WidgetGroup.TEMPLATE, new Map<string, Widget>());
  }

  getWidget(widgetId: string): Widget {
    return this.widgets.get(WidgetGroup.TEMPLATE).get(widgetId);
  }
}
