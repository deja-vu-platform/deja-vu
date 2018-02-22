// BehaviorSubject as opposed to Subject since we want an initial value right
// upon subscription
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { generateId, shallowCopy } from '../../utility/utility';

import { Dimensions, Position } from '../../services/state.service';
import { getDefaultDimensions, getIconLocation } from './widget.settings';
import { UserCliche } from '../cliche/cliche';
import { Project } from '../project/project';
import { some } from 'lodash/collection';
import { pull } from 'lodash/array';

const INCORRECT_TYPE = 'The object is not the correct type for this operation';

enum WidgetType {
  BASE_WIDGET, USER_WIDGET, CLICHE_WIDGET
}

enum BaseWidgetType {
  LINK, LABEL, IMAGE, MENU, PANEL, TAB
}

interface LinkValue {
  text: string;
  target: string;
}

interface PanelValue {
  heading: string;
  content: string;
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
    class?: any;
  };

  isTemplate?: boolean;
  // If this is a template, keep a reference to all is copies.
  // If the template is changed, propagate the changes to the template copies.
  templateCopies?: string[];

  value?: any;
}

interface BaseWidgetFields extends WidgetFields {
  type?: BaseWidgetType;
}

interface LinkBaseWidgetFields extends BaseWidgetFields {
  value?: LinkValue;
}

interface LabelBaseWidgetFields extends BaseWidgetFields {
  value?: string;
}

interface ImageBaseWidgetFields extends BaseWidgetFields {
  value?: string;
}

interface MenuBaseWidgetFields extends BaseWidgetFields {
  value?: LinkValue[];
}

interface TabBaseWidgetFields extends BaseWidgetFields {
  value?: LinkValue[];
}

interface PanelBaseWidgetFields extends BaseWidgetFields {
  value?: PanelValue;
}

interface UserWidgetFields extends WidgetFields {
  innerWidgetIds?: string[]; // earlier in list == lower in z axis
}

export abstract class Widget {
  protected fields: WidgetFields;

  name: BehaviorSubject<string>;
  dimensions: BehaviorSubject<Dimensions>;
  position: BehaviorSubject<Position>;
  styles: BehaviorSubject<any>;
  innerWidgetIds: BehaviorSubject<string[]>;

  /**
   * Converts a JSON object to a Widget object.
   * Copies inner objects so that references are not shared.
   * @param fields object to convert
   */
  static fromJSON(fields: WidgetFields): BaseWidget | UserWidget {
    if (fields.widgetType === undefined || fields.widgetType === null) {
      throw new Error(INCORRECT_TYPE);
    }
    if (fields.widgetType === WidgetType.BASE_WIDGET) {
      return BaseWidget.fromJSON(fields);
    } else {
      return UserWidget.fromJSON(fields);
    }
  }

  static toJSON(widget: Widget) {
    return Widget.copyFields(widget.fields);
  }

  static copyFields(fields: WidgetFields): WidgetFields {
    const copyfields = shallowCopy(fields);
    // Copy the deeper items
    // But don't set things that are not already set!
    if (fields.dimensions) {
      copyfields.dimensions = shallowCopy(fields.dimensions);
    }
    if (fields.position) {
      copyfields.position = shallowCopy(fields.position);
    }
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
  abstract makeCopy(userApp: UserCliche, parentId?: string, fromTemplate?: boolean): Widget[];

  constructor(fields: WidgetFields) {
    this.fields = Widget.copyFields(fields);

    // asign default values;
    this.fields.id = fields.id ? this.fields.id : generateId();

    this.fields.name = fields.name || 'New Widget';
    this.fields.version = fields.version || '0.0.0';
    this.fields.author = fields.author || 'anonymous';

    // don't use updateDimensions or updatePosition here since
    // the behavior subjects aren't initialized yet.
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

    this.name = new BehaviorSubject<string>(this.fields.name);
    this.dimensions = new BehaviorSubject<Dimensions>(this.fields.dimensions);
    this.position = new BehaviorSubject<Position>(this.fields.position);
    this.styles = new BehaviorSubject<any>(this.fields.styles);
    this.innerWidgetIds = new BehaviorSubject<string[]>([]);
  }

  isUserType(): this is UserWidget {
    return this.fields.widgetType === WidgetType.USER_WIDGET;
  }

  isBaseType(): this is BaseWidget {
    return this.fields.widgetType === WidgetType.BASE_WIDGET;
  }

  getIconLocation() {
    return getIconLocation(this);
  }

  getId(): string {
    return this.fields.id;
  }

  getValue(): any {
    return this.fields.value;
  }

  getName(): string {
    return this.fields.name;
  }

  setName(newName: string) {
    this.fields.name = newName;
  }

  getDimensions(): Dimensions {
    return shallowCopy(this.fields.dimensions);
  }

  resetDimensions() {
    this.updateDimensions(getDefaultDimensions(this));
  }

  updateDimensions(newDimensions: Dimensions) {
    this.fields.dimensions = shallowCopy(newDimensions);
    this.dimensions.next(this.fields.dimensions);
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
    return this.fields.isTemplate && some(this.fields.templateCopies, widgetId);
  }

  getInnerWidgetIds(): string[] {
    return [];
  }

  getLocalCustomStyles() {
    return shallowCopy(this.fields.styles.css);
  }

  getPosition(): Position {
    return shallowCopy(this.fields.position);
  }

  resetPosition() {
    this.updatePosition({top: 0, left: 0});
  }

  updatePosition(newPosition: Position) {
    this.fields.position = shallowCopy(newPosition);
    this.position.next(this.fields.position);
  }

  getBootstrapClass() {
    return this.fields.styles.class;
  }

  setBootstrapClass(className: string) {
    this.fields.styles.class = className;
    this.styles.next(this.fields.styles);
  }

  updateCustomStyle(styleName: string, value) {
    this.fields.styles.css[styleName] = value;
    this.styles.next(this.fields.styles);
  }

  removeCustomStyle(styleName?: string) {
    if (styleName) {
      delete this.fields.styles.css[styleName];
    } else {
      Object.keys(this.fields.styles.css).forEach(name => {
        this.fields.styles.css[name] = 'unset';
      });
    }
    this.styles.next(this.fields.styles);
  }

  /**
   * "Inherits" the styles of parent widgets and template widgets and returns
   * the styles that apply to this widget.
   * Order of preference: parent < template < own
   *
   * @param parentStyles any styles to inherit from the ancestors
   */
  getCustomStylesToShow(userApp: UserCliche, parentStyles = {}) {
    // TODO: later on, use this to update a "stylesToShow" field
    // that is read when rendering, and updated whenever a template is
    // updated. If the field is there, just read from it, if not recursively
    // create it.
    const styles = shallowCopy(parentStyles);

    let inheritedStyles = {};
    const templateId = this.getTemplateId();
    if (templateId) {
      inheritedStyles = userApp.getWidget(templateId)
        .getCustomStylesToShow(userApp); // no parent styles for template
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
  remove(userApp: UserCliche) {
    const id = this.getId();
    const templateId = this.getTemplateId();
    if (templateId) {
      userApp.getWidget(templateId).removeTemplateCopy(id);
    }
    userApp.removeWidget(id);
  }

  removeTemplateCopy(widgetId: string) {
    if (this.fields.isTemplate) {
      pull(this.fields.templateCopies, widgetId);
    }
  }

  protected clearTemplateCopyFields(templateId: string) {
    this.fields.templateId = templateId;
    this.fields.isTemplate = false;
    this.fields.styles = {
      css: {}
    };
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

  static fromJSON(fields: BaseWidgetFields): BaseWidget {
    if (fields.widgetType !== WidgetType.BASE_WIDGET) {
      throw new Error(INCORRECT_TYPE);
    }

    if (fields.type === BaseWidgetType.LINK) {
      return new LinkBaseWidget(fields);
    }
    if (fields.type === BaseWidgetType.LABEL) {
      return new LabelBaseWidget(fields);
    }
    if (fields.type === BaseWidgetType.IMAGE) {
      return new ImageBaseWidget(fields);
    }
    if (fields.type === BaseWidgetType.MENU) {
      return new MenuBaseWidget(fields);
    }
    if (fields.type === BaseWidgetType.PANEL) {
      return new PanelBaseWidget(fields);
    }
    if (fields.type === BaseWidgetType.TAB) {
      return new TabBaseWidget(fields);
    }

    throw new Error(INCORRECT_TYPE);
  }

  constructor(fields: BaseWidgetFields) {
    super(fields);

    this.fields.widgetType = WidgetType.BASE_WIDGET;
  }

  isLink(): this is LinkBaseWidget {
    return this.fields.type === BaseWidgetType.LINK;
  }

  isLabel(): this is LabelBaseWidget {
    return this.fields.type === BaseWidgetType.LABEL;
  }

  isImage(): this is ImageBaseWidget {
    return this.fields.type === BaseWidgetType.IMAGE;
  }

  isMenu(): this is MenuBaseWidget {
    return this.fields.type === BaseWidgetType.MENU;
  }

  isTab(): this is TabBaseWidget {
    return this.fields.type === BaseWidgetType.TAB;
  }

  isPanel(): this is PanelBaseWidget {
    return this.fields.type === BaseWidgetType.PANEL;
  }

  makeCopy(userApp: UserCliche, parentId?: string, fromTemplate = false): Widget[] {
    const fields = this.fields;

    const copyWidget = BaseWidget.fromJSON(fields);

    copyWidget.fields.id = generateId();

    if (parentId) {
      copyWidget.setParentId(parentId);
    }

    if (fromTemplate) {
      // If you're making a tempate copy, add to template copies
      this.fields.templateCopies.push(copyWidget.getId());

      // reset fields to to be copies over
      copyWidget.clearTemplateCopyFields(this.getId());
    }

    // Add it to the userApp
    // TODO not sure if this should be done here or somewhere else
    userApp.addWidget(copyWidget);

    return [copyWidget];
  }
}

export class LinkBaseWidget extends BaseWidget {
  protected fields: LinkBaseWidgetFields;

  constructor(fields: LinkBaseWidgetFields) {
    super(fields);
    this.fields.type = BaseWidgetType.LINK;
    this.setValue(this.fields.value || { text: '', target: '' });

    this.setName(fields.name || 'Link Widget');
    this.updateDimensions(fields.dimensions || getDefaultDimensions(this));
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

  constructor(fields: LabelBaseWidgetFields) {
    super(fields);
    this.fields.type = BaseWidgetType.LABEL;
    this.setValue(this.fields.value || 'Write your label here...');

    this.setName(fields.name || 'Label Widget');
    this.updateDimensions(fields.dimensions || getDefaultDimensions(this));
  }
  setValue(value: string) {
    this.fields.value = value;
  }

  getValue(): string {
    return this.fields.value;
  }
}


export class ImageBaseWidget extends BaseWidget {
  protected fields: ImageBaseWidgetFields;

  constructor(fields: ImageBaseWidgetFields) {
    super(fields);
    this.fields.type = BaseWidgetType.IMAGE;
    // TODO this default value is not robust
    this.setValue(this.fields.value || this.getIconLocation());

    this.setName(fields.name || 'Image Widget');
    this.updateDimensions(fields.dimensions || getDefaultDimensions(this));
  }
  setValue(value: string) {
    this.fields.value = value;
  }

  getValue(): string {
    return this.fields.value;
  }
}


export class MenuBaseWidget extends BaseWidget {
  protected fields: MenuBaseWidgetFields;

  constructor(fields: MenuBaseWidgetFields) {
    super(fields);
    this.fields.type = BaseWidgetType.MENU;
    this.setValue(this.fields.value || []);

    this.setName(fields.name || 'Menu Widget');
    this.updateDimensions(fields.dimensions || getDefaultDimensions(this));
  }
  setValue(value: LinkValue[]) {
    this.fields.value = shallowCopy(value);
  }

  getNew(count): LinkValue {
    return { // TODO
      text: 'Menu ' + count,
      target: '???' + count
    };
  }

  getValue(): LinkValue[] {
    return shallowCopy(this.fields.value);
  }
}


export class PanelBaseWidget extends BaseWidget {
  protected fields: PanelBaseWidgetFields;

  constructor(fields: PanelBaseWidgetFields) {
    super(fields);
    this.fields.type = BaseWidgetType.PANEL;
    this.setValue(this.fields.value || {heading: 'Type heading...', content: 'Type content...'});

    this.setName(fields.name || 'Panel Widget');
    this.updateDimensions(fields.dimensions ||  getDefaultDimensions(this));
  }
  setValue(value: PanelValue) {
    this.fields.value = shallowCopy(value);
  }

  getValue(): PanelValue {
    return shallowCopy(this.fields.value);
  }
}


export class TabBaseWidget extends BaseWidget {
  protected fields: TabBaseWidgetFields;

  constructor(fields: TabBaseWidgetFields) {
    super(fields);
    this.fields.type = BaseWidgetType.TAB;
    this.setValue(this.fields.value || []);

    this.setName(fields.name || 'Tab Widget');
    this.updateDimensions(fields.dimensions || getDefaultDimensions(this));
  }
  setValue(value: LinkValue[]) {
    this.fields.value = shallowCopy(value);
  }

  getNew(count): LinkValue {
    return { // TODO
      text: 'Tab ' + count,
      target: 'tab-id-' + count
    };
  }

  getValue(): LinkValue[] {
    return shallowCopy(this.fields.value);
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
  static fromJSON(fields: UserWidgetFields): UserWidget {
    if (fields.widgetType !== WidgetType.USER_WIDGET) {
      throw new Error(INCORRECT_TYPE);
    }
    return new UserWidget(fields);
  }

  constructor(fields: UserWidgetFields) {
    super(fields);

    this.fields.widgetType = WidgetType.USER_WIDGET;
    this.fields.innerWidgetIds =
      fields.innerWidgetIds ? fields.innerWidgetIds.slice() : [];

    this.innerWidgetIds.next(this.fields.innerWidgetIds);
  }

  // TODO perhaps this should also be a cliche function
  setAsInnerWidget(userApp: UserCliche, widget: Widget) {
    const id = widget.getId();
    // Now the inner widgets list is the stack order
    this.fields.innerWidgetIds.push(id);
    widget.setParentId(this.getId());
    userApp.setAsInnerWidget(widget);
    this.innerWidgetIds.next(this.fields.innerWidgetIds);
  }

  // TODO perhaps this should also be a cliche function
  unlinkInnerWidget(userApp: UserCliche, id: string) {
    pull(this.fields.innerWidgetIds, id);

    // reset a couple of things for this widget
    const widget = userApp.getWidget(id);
    widget.resetPosition();
    widget.setParentId(undefined);
    userApp.setAsFreeWidget(widget);

    // remove this widget from parent's list
    this.innerWidgetIds.next(this.fields.innerWidgetIds);
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
  private getPathHelper(userApp: UserCliche, widgetId: string, targetId: string): string[] | null {
    // Base case: found it
    if (widgetId === targetId) {
      return [widgetId];
    }
    // Recursive case, look through all the inner widgets
    const widget = userApp.getWidget(widgetId);
    for (const id of widget.getInnerWidgetIds()) {
      const path = this.getPathHelper(userApp, id, targetId);
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
  getPath(userApp: UserCliche, widgetId: string): string[] | null {
    return this.getPathHelper(userApp, this.getId(), widgetId);
  }

  // TODO this function should actually be in the cliche
  /**
   * Returns the wanted widget if it is a child of this widget, else null
   *
   * @param targetId id of widget to find
   * @param getParent whether to actually only get the parent of the widget
   */
  getInnerWidget(userApp: UserCliche, targetId: string, getParent = false): Widget {
    const path = this.getPath(userApp, targetId);
    if (path === null) { // it's not actually a child
      return null;
    }
    if (getParent) {
      targetId = path[path.length - 2];
    }
    return userApp.getWidget(targetId);
  }

  /**
   *
   * @param fromTemplate if this widget is not a template, this value is
   * ignored
   */
  makeCopy(userApp: UserCliche, parentId?: string, fromTemplate = false): Widget[] {
    const copyWidget = new UserWidget(this.fields);

    copyWidget.fields.id = generateId();
    copyWidget.fields.innerWidgetIds = [];

    if (parentId) {
      copyWidget.setParentId(parentId);
    }

    if (fromTemplate) {
      // If you're making a tempate copy, add it to template copy list
      this.fields.templateCopies.push(copyWidget.getId());

      copyWidget.clearTemplateCopyFields(this.getId());
    }

    // Add it to the userApp
    // TODO not sure if this should be done here or somewhere else
    userApp.addWidget(copyWidget);

    let copyWidgets: Widget[] = [copyWidget];
    for (const id of this.fields.innerWidgetIds) {
      const copyInnerWidgets = userApp.getWidget(id).makeCopy(userApp, copyWidget.getId(), fromTemplate);
      const innerWidgetCopy = copyInnerWidgets[0];
      copyWidget.setAsInnerWidget(userApp, innerWidgetCopy);
      copyWidgets = copyWidgets.concat(copyInnerWidgets);
    }
    return copyWidgets;
  }

  putInnerWidgetOnTop(userApp: UserCliche, widget: Widget) {
    const topWidgetId = this.fields.innerWidgetIds[this.fields.innerWidgetIds.length - 1];
    this.changeInnerWidgetOrderByOne(userApp, widget, true, new Set([topWidgetId]));
  }

  /**
   * Given the widgets one inner widget overlaps with, it swaps it with the
   * closest next widget
   * @param widgetId widget to shift
   * @param overlappingWidgetIds widget it overlaps with
   * @param isUp whether to move up or down
   */
  changeInnerWidgetOrderByOne(
    userApp: UserCliche,
    widget: Widget,
    isUp: boolean,
    overlappingWidgetIds?: Set<string>) {

    const widgetId = widget.getId();
    if (!overlappingWidgetIds) {
      overlappingWidgetIds = this.findOverlappingWidgets(userApp, widget);
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

    this.innerWidgetIds.next(this.fields.innerWidgetIds);
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
  findOverlappingWidgets(userApp: UserCliche, targetWidget: Widget): Set<string> {
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
      const widget = userApp.getWidget(widgetId);
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
