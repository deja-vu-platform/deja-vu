import { generateId, shallowCopy, inArray } from '../../utility/utility';
import { Dimensions, Position } from '../../services/state.service';
import { Cliche, UserCliche } from '../cliche/cliche';
import { Project } from '../project/project';

enum WidgetType {
  BASE_WIDGET, USER_WIDGET, CLICHE_WIDGET
}

enum BaseWidgetType {
  LINK, LABEL
}

interface LinkValue {
  text: string;
  target: string;
}

interface WidgetFields {
  widgetType?: WidgetType;

  id?: string;
  templateId?: string;
  clicheId?: string;
  parentId?: string;

  name?: string;
  author?: string;
  version?: string;

  dimensions?: Dimensions;
  position?: Position;

  styles?: {
    css?: any;
  };

  isTemplate?: boolean;
  // If this is a template, keep a reference to all is copies.
  // If the template is changed, propagate the changes to the template copies.
  templateCopies?: string[];
}

interface BaseWidgetFields extends WidgetFields {
  type?: BaseWidgetType;
  value?: any;
}

interface LinkBaseWidgetFields extends BaseWidgetFields {
  value?: LinkValue;
}

interface LabelBaseWidgetFields extends BaseWidgetFields {
  value?: string;
}

interface UserWidgetFields extends WidgetFields {
  innerWidgetIds?: string[]; // earlier in list == lower in z axis
}

export abstract class Widget {
  protected fields: WidgetFields;
  protected project: Project;

  /**
   * Converts a JSON object to a Widget object.
   * Copies inner objects so that references are not shared.
   * @param fields object to convert
   */
  static fromJSON(project: Project, fields: WidgetFields): BaseWidget | UserWidget {
    const notCorrectObject = 'Object is not an instance of a Widget';
    if (fields.widgetType === undefined || fields.widgetType === null) {
      throw new Error(notCorrectObject);
    }
    if (fields.widgetType === WidgetType.BASE_WIDGET) {
      return BaseWidget.fromJSON(project, fields);
    } else {
      return UserWidget.fromJSON(project, fields);
    }
  }

  static toJSON(widget: Widget) {
    return Widget.copyFields(widget.fields);
  }

  static copyFields(fields: WidgetFields): WidgetFields {
    const copyfields = shallowCopy(fields);
    // Copy the deeper items
    copyfields.dimensions = shallowCopy(fields.dimensions);
    copyfields.position = shallowCopy(fields.position);
    if (fields.styles) {
      copyfields.styles.css = shallowCopy(fields.styles.css);
    }
    if (fields.templateCopies) {
      copyfields.templateCopies = fields.templateCopies.slice();
    }

    return copyfields;
  }

  /**
   * Makes a copy of the widget and returns a list of copies of this widget
   * and all inner widgets
   * @param fromTemplate Whether of not we are doing a "template" copy as
   *  opposed to a normal copy
   */
  abstract makeCopy(parentId?: string, fromTemplate?: boolean): Widget[];

  constructor(
    fields: WidgetFields,
    project?: Project
  ) {
    this.project = project;

    this.fields = Widget.copyFields(fields);

    // asign default values;
    this.fields.id = fields.id ? this.fields.id : generateId();

    this.fields.name = fields.name || 'New Widget';
    this.fields.version = fields.version || '0.0.0';
    this.fields.author = fields.author || 'anonymous';

    this.fields.dimensions = this.fields.dimensions || {
      height: 0,
      width: 0
    };
    this.fields.position = this.fields.position || {
      top: 0,
      left: 0
    };

    this.fields.styles = this.fields.styles || {
      css: {}
    };

    this.fields.templateCopies = this.fields.templateCopies || [];
  }

  isUserType(): this is UserWidget {
    return this.fields.widgetType === WidgetType.USER_WIDGET;
  }

  isBaseType(): this is BaseWidget {
    return this.fields.widgetType === WidgetType.BASE_WIDGET;
  }

  getProject(): Project {
    return this.project;
  }

  setProject(project: Project) {
    this.project = project;
  }

  getId(): string {
    return this.fields.id;
  }

  getName(): string {
    return this.fields.name;
  }

  getDimensions(): Dimensions {
    return shallowCopy(this.fields.dimensions);
  }

  updateDimensions(newDimensions: Dimensions) {
    this.fields.dimensions = shallowCopy(newDimensions);
  }

  getClicheId(): string {
    return this.fields.clicheId;
  }

  setClicheId(cid: string) {
    this.fields.clicheId = cid;
  }

  getParentId(): string {
    return this.fields.parentId;
  }

  setParentId(id: string) {
    this.fields.parentId = id;
  }

  getTemplateId(): string {
    return this.fields.templateId;
  }

  isTemplate(): boolean {
    return !!this.fields.isTemplate;
  }

  setAsTemplate() {
    this.fields.isTemplate = true;
  }

  /**
   * Checks if the given widget (id) was derived from this widget
   * as a template.
   * @param widgetId widget to check.
   */
  isDerivedFromTemplate(widgetId: string) {
    return this.fields.isTemplate && inArray(widgetId, this.fields.templateCopies);
  }

  getLocalCustomStyles() {
    return shallowCopy(this.fields.styles.css);
  }

  getPosition(): Position {
    return shallowCopy(this.fields.position);
  }

  updatePosition(newPosition: Position) {
    this.fields.position = shallowCopy(newPosition);
  }

  updateCustomStyle(styleName: string, value) {
    this.fields.styles.css[styleName] = value;
  }

  removeCustomStyle(styleName?: string) {
    if (styleName) {
      delete this.fields.styles.css[styleName];
    } else {
      Object.keys(this.fields.styles.css).forEach(name => {
        this.fields.styles.css[name] = 'unset';
      });
    }
  }

  /**
   * "Inherits" the styles of parent widgets and template widgets and returns
   * the styles that apply to this widget.
   * Order of preference: parent < template < own
   *
   * @param parentStyles any styles to inherit from the ancestors
   */
  getCustomStylesToShow(parentStyles = {}) {
    // TODO: later on, use this to update a "stylesToShow" field
    // that is read when rendering, and updated whenever a template is
    // updated. If the field is there, just read from it, if not recursively
    // create it.
    const styles = shallowCopy(parentStyles);

    let inheritedStyles = {};
    const templateId = this.getTemplateId();
    if (templateId) {
      inheritedStyles = this.project
        .getAppWidget(templateId)
        .getCustomStylesToShow(); // no parent styles for template
    }

    for (const style of Object.keys(inheritedStyles)) {
      styles[style] = inheritedStyles[style];
    }

    // this widgets styles win!
    for (const style of Object.keys(this.fields.styles.css)) {
      styles[style] = this.fields.styles.css[style];
    }

    return styles;
  }

  /**
   * Just deletes from the all widgets table and the template reference if
   * it has one. Doesn't touch inner widgets if any.
   */
  remove() {
    this.project.removeWidget(this.getId(), this.getTemplateId());
  }

  removeTemplateCopy(widgetId: string) {
    if (this.fields.isTemplate) {
      const index = this.fields.templateCopies.indexOf(widgetId);
      this.fields.templateCopies.splice( index, 1 );
    }
  }
}

/**
 * Base Widget model
 * @param type
 * @param widgets
 * @constructor
 */
export class BaseWidget extends Widget {
  protected fields: BaseWidgetFields;

  static fromJSON(project: Project, fields: BaseWidgetFields): BaseWidget {
    if (fields.widgetType !== WidgetType.BASE_WIDGET) {
      return null;
      // TODO throw error
    }

    if (fields.type === BaseWidgetType.LINK) {
      return new LinkBaseWidget(fields, project);
    }
    if (fields.type === BaseWidgetType.LABEL) {
      return new LabelBaseWidget(fields, project);
    }

    // TODO throw error
    return null;
  }

  constructor(
    fields: BaseWidgetFields,
    project?: Project
  ) {
    super(fields, project);

    this.fields.widgetType = WidgetType.BASE_WIDGET;
  }

  isLink(): this is LinkBaseWidget {
    return this.fields.type === BaseWidgetType.LINK;
  }

  isLabel(): this is LabelBaseWidget {
    return this.fields.type === BaseWidgetType.LABEL;
  }

  makeCopy(parentId?: string, fromTemplate = false): Widget[] {
    let templateId = this.getTemplateId();
    let isTemplate = this.fields.isTemplate;
    const isTemplateCopy = fromTemplate && isTemplate;

    if (isTemplateCopy) {
      // If you're making a tempate copy, you only make non-templates
      templateId = this.getId();
      isTemplate = false;
    }
    let copyWidget: BaseWidget;
    const project = this.project;
    const fields = this.fields;
    const value = this.fields.value;

    if (this.isLabel()) {
      copyWidget = new LabelBaseWidget(fields, project);
    }
    if (this.isLink()) {
      copyWidget = new LinkBaseWidget(fields, project);
    }

    copyWidget.fields.id = generateId();

    if (parentId) {
      copyWidget.setParentId(parentId);
    }

    if (isTemplateCopy) {
      // If you're making a tempate copy, add to template copies
      this.fields.templateCopies.push(copyWidget.getId());

      // TODO dry
      // reset fields to to be copies over
      copyWidget.fields.templateId = this.getId();
      copyWidget.fields.isTemplate = false;
      copyWidget.fields.styles = {
        css: {}
      };
    }

    return [copyWidget];
  }
}

export class LinkBaseWidget extends BaseWidget {
  protected fields: LinkBaseWidgetFields;

  constructor(
    fields: LinkBaseWidgetFields,
    project?: Project,
  ) {
    super(fields, project);
    this.fields.type = BaseWidgetType.LINK;
    this.fields.value = this.fields.value || { text: '', target: '' };

    this.fields.name = fields.name || 'Link Widget';
    this.fields.dimensions = fields.dimensions ? this.fields.dimensions : { width: 100, height: 50 };
  }

  setValue(value: LinkValue) {
    this.fields.value = shallowCopy(value);
  }

  getValue(): LinkValue {
    return shallowCopy(this.fields.value);
  }
}

export class LabelBaseWidget extends BaseWidget {
  protected fields: LabelBaseWidgetFields;

  constructor(
    fields: LabelBaseWidgetFields,
    project?: Project,
  ) {
    super(fields, project);
    this.fields.type = BaseWidgetType.LABEL;
    this.fields.value = this.fields.value || 'Write your label here...';

    this.fields.name = fields.name || 'Label Widget';
    this.fields.dimensions = fields.dimensions ? this.fields.dimensions : { width: 400, height: 200 };
  }
  setValue(value: string) {
    this.fields.value = value;
  }

  getValue(): string {
    return this.fields.value;
  }
}

/**
 *
 * @param dimensions
 * @param name
 * @param id
 * @param version
 * @param author
 * @returns {UserWidget}
 * @constructor
 */
export class UserWidget extends Widget {
  protected fields: UserWidgetFields;
  // TODO switch order
  static fromJSON(project: Project, fields: UserWidgetFields): UserWidget {
    if (fields.widgetType !== WidgetType.USER_WIDGET) {
      return null;
      // TODO throw error
    }
    return new UserWidget(fields, project);
  }

  constructor(
    fields: UserWidgetFields,
    project?: Project,
  ) {
    super(fields, project);

    this.fields.widgetType = WidgetType.USER_WIDGET;
    this.fields.innerWidgetIds =
      fields.innerWidgetIds ? fields.innerWidgetIds.slice() : [];
  }

  addInnerWidget(widget: Widget) {
    const id = widget.getId();
    // Now the inner widgets list is the stack order
    this.fields.innerWidgetIds.push(id);
    widget.setParentId(this.getId());
    this.project.userApp.removeUnusedWidget(id);
    this.project.userApp.addUsedWidget(widget);
  }

  removeInnerWidget(id: string) {
    const index = this.fields.innerWidgetIds.indexOf(id);
    this.fields.innerWidgetIds.splice(index, 1);

    const widget = this.project.getUserApp().getWidget(id);
    widget.setParentId(undefined);
    this.project.userApp.removeUsedWidget(id);
    this.project.userApp.addUnusedWidget(widget);
  }

  getInnerWidgetIds() {
    return this.fields.innerWidgetIds.slice();
  }

  /**
   * Returns path starting from this id to the wanted widget id
   *  null if no path exists
   *
   * @param widget widget we are currently looking at
   * @param targetId widget id of widget to find
   */
  private getPathHelper(widget: Widget, targetId: string): string[] | null {
    const widgetId = widget.getId();
    // Base case 1: found it
    if (widgetId === targetId) {
      return [widgetId];
    }
    // Base case 2: reached a BaseWidget without finding it
    if (widget.isBaseType()) {
      return null;
    }
    // Recursive case, look through all the inner widgets
    for (const id of (<UserWidget>widget).fields.innerWidgetIds) {
      const path = this.getPathHelper(
        this.project.getAppWidget(id), targetId);
      if (path === null) {
        continue;
      }
      // else, we've found it! return
      return [widgetId].concat(path);
    }
    // didn't find anything...
    return null;
  }

  /**
   * Returns path starting from this id to the wanted widget id
   *  null if no path exists
   *
   * @param widgetId widget id of widget to find
   */
  getPath(widgetId: string): string[] | null {
    return this.getPathHelper(this, widgetId);
  }

  /**
   * Returns the wanted widget if it is a child of this widget, else null
   *
   * @param targetId id of widget to find
   * @param getParent whether to actually only get the parent of the widget
   */
  getInnerWidget(targetId: string, getParent = false): Widget {
    const path = this.getPath(targetId);
    if (path === null) { // it's not actually a child
      return null;
    }
    if (getParent) {
      targetId = path[path.length - 2];
    }
    return this.project.getAppWidget(targetId);
  }

  /**
   *
   * @param fromTemplate if this widget is not a template, this value is
   * ignored
   */
  makeCopy(parentId?: string, fromTemplate = false): Widget[] {
    // TODO find a way to merge this and the fromObject code since
    // they are very similar

    let templateId = this.getTemplateId();
    let isTemplate = this.fields.isTemplate;
    const isTemplateCopy = fromTemplate && this.fields.isTemplate;
    if (isTemplateCopy) {
      // If you're making a tempate copy, you only make non-templates
      templateId = this.getId();
      isTemplate = false;
    }
    const copyWidget = new UserWidget(this.fields,
      this.project);

    copyWidget.fields.id = generateId();
    copyWidget.fields.innerWidgetIds = [];

    if (parentId) {
      copyWidget.setParentId(parentId);
    }

    if (isTemplateCopy) {
      // If you're making a tempate copy, add it to template copy list
      this.fields.templateCopies.push(copyWidget.getId());

      // TODO dry
      copyWidget.fields.templateId = this.getId();
      copyWidget.fields.isTemplate = false;
      copyWidget.fields.styles = {
        css: {}
      };
    }

    let copyWidgets: Widget[] = [copyWidget];
    for (const id of this.fields.innerWidgetIds) {
      const copyInnerWidgets = this.project.getAppWidget(id).makeCopy(copyWidget.getId(), fromTemplate);
      const innerWidgetCopy = copyInnerWidgets[0];
      copyWidget.addInnerWidget(innerWidgetCopy);
      copyWidgets = copyWidgets.concat(copyInnerWidgets);
    }
    return copyWidgets;
  }

  putInnerWidgetOnTop(widget: Widget) {
    const topWidgetId = this.fields.innerWidgetIds[this.fields.innerWidgetIds.length - 1];
    this.changeInnerWidgetOrderByOne(widget, true, new Set([topWidgetId]));
  }

  /**
   * Given the widgets one inner widget overlaps with, it swaps it with the
   * closest next widget
   * @param widgetId widget to shift
   * @param overlappingWidgetIds widget it overlaps with
   * @param isUp whether to move up or down
   */
  changeInnerWidgetOrderByOne(
    widget: Widget, isUp: boolean, overlappingWidgetIds?: Set<string>) {

    const widgetId = widget.getId();
    if (!overlappingWidgetIds) {
      overlappingWidgetIds = this.findOverlappingWidgets(widget);
    }
    const stackOrder = this.fields.innerWidgetIds;
    let idxThisWidget;
    let idxNextWidget;

    if (!isUp) {
      stackOrder.reverse();
    }

    for (let i = 0; i < stackOrder.length; i++) {
      const id = stackOrder[i];
      if (id === widgetId) {
        idxThisWidget = i;
      }
      if (idxThisWidget !== undefined) {
        // if we found our first component,
        // find the next component that overlaps after this.
        // that is the one we swap with.
        if (overlappingWidgetIds.has(id)) {
          idxNextWidget = i;
          break;
        }
      }
    }

    // if there is something to move
    if (idxThisWidget !== undefined && idxNextWidget !== undefined) {
      let idxToSwap = idxThisWidget;
      // from the component after this to the next
      for (let i = idxThisWidget + 1; i < idxNextWidget + 1; i++) {
        const id = stackOrder[i];
        stackOrder[idxToSwap] = id;
        idxToSwap = i;
      }
      stackOrder[idxNextWidget] = widgetId;
    }

    if (!isUp) {
      stackOrder.reverse();
    }
  }

  /**
   * Decides if the given x,y coordinate is in the box specified by
   *  the remaining coordinates.
   * @param x
   * @param y
   * @param boxTop
   * @param boxRight
   * @param boxBottom
   * @param boxLeft
   */
  private coordInBox(x, y, boxTop, boxRight, boxBottom, boxLeft) {
    return (boxLeft <= x && x <= boxRight) && (boxTop <= y && y <= boxBottom);
  }

  /**
   * Finds widgets that are overlapping with the given widget
   * @param targetWidget widget we are looking at
   */
  findOverlappingWidgets(targetWidget: Widget): Set<string> {
    const overlappingWidgets = new Set();
    const targetTop = targetWidget.getPosition().top;
    const targetLeft = targetWidget.getPosition().left;
    const targetRight = targetLeft + targetWidget.getDimensions().width;
    const targetBottom = targetTop + targetWidget.getDimensions().height;

    const that = this;

    this.fields.innerWidgetIds.forEach((widgetId) => {
      if (widgetId === targetWidget.getId()) {
        return;
      }
      const widget = this.project.getAppWidget(widgetId);
      const top = widget.getPosition().top;
      const left = widget.getPosition().left;
      const right = left + widget.getDimensions().width;
      const bottom = top + widget.getDimensions().height;

      let overlap = false;

      [targetLeft, targetRight].forEach(function (x) {
        [targetTop, targetBottom].forEach(function (y) {
          overlap = overlap || that.coordInBox(x, y, top, right, bottom, left);
        });
      });

      [left, right].forEach(function (x) {
        [top, bottom].forEach(function (y) {
          overlap = overlap || that.coordInBox(x, y, targetTop, targetRight, targetBottom, targetLeft);
        });
      });

      if (overlap) {
        overlappingWidgets.add(widgetId);
      }
    });
    return overlappingWidgets;
  }
}
