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

  widgetFields?: any;
}

interface UserClicheFields extends ClicheFields {
  pageIds?: string[];
  innerWidgetIds?: string[];
  freeWidgetIds?: string[];
  templateIds?: string[];
}

export abstract class Cliche {
  // A cliche contains the actual widget objects
  protected fields: ClicheFields;
  protected project: Project;
  protected widgets: Map<string, Widget>;

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

    // Update to the freshest copy of widgets
    json.widgetFields = {};
    cliche.widgets.forEach((widget, widgetId) => {
      json.widgetFields[widgetId] =
        Widget.toJSON(widget);
    });

    return json;
  }

  static copyFields(fields: ClicheFields): ClicheFields {
    const copyfields = shallowCopy(fields);

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

    // initialize widget map
    this.widgets = new Map<string, Widget>();
    if (fields.widgetFields) {
      Object.keys(fields.widgetFields).forEach(widgetId => {
        this.widgets.set(widgetId,
          Widget.fromJSON(fields.widgetFields[widgetId], project));
      });
    }
  }

  getWidget(widgetId: string): Widget {
    return this.widgets.get(widgetId);
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
    this.fields.freeWidgetIds = fields.freeWidgetIds ?
      fields.freeWidgetIds.slice() : [];
  }

  private cleanAssociations(widgetId: string) {
    removeFirstFromArray(widgetId, this.fields.pageIds);
    removeFirstFromArray(widgetId, this.fields.templateIds);
    removeFirstFromArray(widgetId, this.fields.innerWidgetIds);
    removeFirstFromArray(widgetId, this.fields.freeWidgetIds);
  }

  /**
   * Adds a widget. It is initially set as free (unused).
   * @param widget
   */
  addWidget(widget: Widget) {
    if (widget.getClicheId() !== this.getId()) {
      throw new Error('Not a user application widget!');
    }
    this.widgets.set(widget.getId(), widget);
    this.fields.freeWidgetIds.push(widget.getId());
  }

  removeWidget(widgetId: string) {
    this.widgets.delete(widgetId);
    this.cleanAssociations(widgetId);
  }

  isPage (widgetId: string): boolean {
    return inArray(widgetId, this.fields.pageIds);
  }

  numPages(): number {
    return this.fields.pageIds.length;
  }

  setAsPage (widget: Widget) {
    this.checkWidgetInCliche(widget);
    this.cleanAssociations(widget.getId());
    this.fields.pageIds.push(widget.getId());
    // TODO add inner widgets as used widgets
  }

  getPageIds (): string[] {
    return this.fields.pageIds.slice();
  }

  setAsTemplate (widget: Widget) {
    this.checkWidgetInCliche(widget);
    widget.setAsTemplate();
    this.cleanAssociations(widget.getId());
    this.fields.templateIds.push(widget.getId());
  }

  getTemplateIds (): string[] {
    return this.fields.templateIds.slice();
  }

  setAsFreeWidget (widget: Widget) {
    this.checkWidgetInCliche(widget);
    this.cleanAssociations(widget.getId());
    this.fields.freeWidgetIds.push(widget.getId());
  }

  getFreeWidgetIds (): string[] {
    return this.fields.freeWidgetIds.slice();
  }

  setAsInnerWidget (widget: Widget) {
    this.checkWidgetInCliche(widget);
    this.cleanAssociations(widget.getId());
    this.fields.innerWidgetIds.push(widget.getId());
  }

  getInnerWidgetIds (): string[] {
    return this.fields.innerWidgetIds.slice();
  }

  private checkWidgetInCliche(widget: Widget) {
    if (!this.getWidget(widget.getId())) {
      throw new Error ('Widget not added to cliche!');
    }
  }
}

export class DvCliche extends Cliche {
  constructor (fields: ClicheFields, project: Project) {
    super(fields, project);
    this.fields.clicheType = ClicheType.DV_CLICHE;
  }
}
