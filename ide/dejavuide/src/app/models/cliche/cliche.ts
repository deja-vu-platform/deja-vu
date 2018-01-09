import { generateId, shallowCopy, inArray, removeFirstFromArray } from '../../utility/utility';
import { Widget } from '../widget/widget';
import { Project } from '../project/project';

export enum ClicheType {
  USER_CLICHE, DV_CLICHE
}

interface ClicheFields {
  clicheType?: ClicheType;
  id?: string;

  name?: string;
  author?: string;
  version?: string;

  widgets?: any;
}

interface UserClicheFields extends ClicheFields {
  pageIds?: string[];
  innerWidgetIds?: string[];
  unusedWidgetIds?: string[];
  templateIds?: string[];
}

export abstract class Cliche {
  // A cliche contains the actual widget objects
  protected fields: ClicheFields;
  protected project: Project;

  /**
   * Converts a JSON object to a Widget object
   * @param object object to convert
   */
  static fromJSON(object: ClicheFields, project: Project): UserCliche | DvCliche {
    const notCorrectObject = 'Object is not an instance of a Cliche';
    if (object.clicheType === undefined || object.clicheType === null) {
        throw new Error(notCorrectObject);
    }
    if (object.clicheType === ClicheType.USER_CLICHE) {
        return UserCliche.fromJSON(object, project);
    }
    return DvCliche.fromJSON(object, project);
  }

  static toJSON(cliche: Cliche) {
    const json = Cliche.copyFields(cliche.fields);
    json.widgets = {};
    Object.keys(cliche.fields.widgets).forEach(widgetId => {
      json.widgets[widgetId] =
        Widget.toJSON(cliche.fields.widgets[widgetId]);
    });

    return json;
  }


  static copyFields(fields: ClicheFields): ClicheFields {
    let copyfields = {...fields};

    delete copyfields.widgets;
    copyfields = shallowCopy(copyfields);

    // For the uses of this function, we don't actually want to copy the widget
    // objects.
    copyfields.widgets = fields.widgets;

    return copyfields;
  }

  constructor (fields: ClicheFields, project: Project) {
    this.project = project;

    this.fields = Cliche.copyFields(fields);
    // asign default values;
    this.fields.id = fields.id ? this.fields.id : generateId();

    this.fields.name = fields.name || 'New Cliche';
    this.fields.version = fields.version || '0.0.0';
    this.fields.author = fields.author || 'anonymous';
    // TODO
    this.fields.widgets = this.fields.widgets || {};
  }

  getWidget(widgetId: string): Widget {
    return this.fields.widgets[widgetId];
  }

  getName(): string {
    return this.fields.name;
  }

  getId(): string {
    return this.fields.id;
  }
}

export class UserCliche extends Cliche {
  protected fields: UserClicheFields;

  static fromJSON(fields: UserClicheFields, project: Project) {
    if (fields.clicheType !== ClicheType.USER_CLICHE) {
      throw new Error('TODO');
    }
    const cliche = new UserCliche(fields, project);

    Object.keys(fields.widgets).forEach(widgetId => {
      cliche.fields.widgets[widgetId] =
        Widget.fromJSON(fields.widgets[widgetId], project);
    });

    return cliche;
  }


  constructor (fields: UserClicheFields, project: Project) {
    super(fields, project);
    this.fields.clicheType = ClicheType.USER_CLICHE;

    this.fields.pageIds = fields.pageIds ? fields.pageIds.slice() : [];
    this.fields.templateIds = fields.templateIds ?
      fields.templateIds.slice() : [];
    this.fields.innerWidgetIds = fields.innerWidgetIds ?
      fields.innerWidgetIds.slice() : [];
    this.fields.unusedWidgetIds = fields.unusedWidgetIds ?
      fields.unusedWidgetIds.slice() : [];
  }

  private cleanAssociations(widgetId: string) {
    removeFirstFromArray(widgetId, this.fields.pageIds);
    removeFirstFromArray(widgetId, this.fields.templateIds);
    removeFirstFromArray(widgetId, this.fields.innerWidgetIds);
    removeFirstFromArray(widgetId, this.fields.unusedWidgetIds);
  }

  /**
   * Adds a widget. It is initially set as unused.
   * @param widget
   */
  addWidget(widget: Widget) {
    if (widget.getClicheId() !== this.getId()) {
      throw new Error('Not a user application widget!');
    }
    this.fields.widgets[widget.getId()] = widget;
    this.fields.unusedWidgetIds.push(widget.getId());
  }

  removeWidget(widgetId: string) {
    delete this.fields.widgets[widgetId];
    this.cleanAssociations(widgetId);
  }

  isPage (widgetId: string): boolean {
    return inArray(widgetId, this.fields.pageIds);
  }

  numPages(): number {
    return this.fields.pageIds.length;
  }

  setAsPage (widget: Widget) {
    this.cleanAssociations(widget.getId());
    this.fields.pageIds.push(widget.getId());
    // TODO add inner widgets as used widgets
  }

  getPageIds (): string[] {
    return this.fields.pageIds.slice();
  }

  setAsTemplate (widget: Widget) {
    widget.setAsTemplate();
    this.cleanAssociations(widget.getId());
    this.fields.templateIds.push(widget.getId());
  }

  addTemplateAndInner (widgets: Widget[]) {
    this.setAsTemplate(widgets[0]);
    widgets.forEach((widget, index) => {
      this.addWidget(widget);
      if (index !== 0) {
        this.setAsInnerWidget(widget);
      }
    });
  }

  getTemplateIds (): string[] {
    return this.fields.templateIds.slice();
  }

  setAsUnused (widget: Widget) {
    this.cleanAssociations(widget.getId());
    this.fields.unusedWidgetIds.push(widget.getId());
  }

  getUnusedWidgetIds (): string[] {
    return this.fields.unusedWidgetIds.slice();
  }

  setAsInnerWidget (widget: Widget) {
    this.cleanAssociations(widget.getId());
    this.fields.innerWidgetIds.push(widget.getId());
  }

  addWidgetsAsUsed (widgets: Widget[]) {
    widgets.forEach(widget => {
      this.addWidget(widget);
      this.setAsInnerWidget(widget);
    });
  }

  getInnerWidgetIds (): string[] {
    return this.fields.innerWidgetIds.slice();
  }
}

export class DvCliche extends Cliche {
  constructor (fields: ClicheFields, project: Project) {
    super(fields, project);
    this.fields.clicheType = ClicheType.DV_CLICHE;
  }
}
