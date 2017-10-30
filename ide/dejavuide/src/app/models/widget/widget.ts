import { generateId, Dimensions, Position } from '../../utility/utility';
import { Cliche, UserCliche } from '../cliche/cliche';
import { Meta } from '../project/project';

export enum WidgetType {
    BASE_WIDGET, USER_WIDGET, CLICHE_WIDGET
}

export interface Properties {
    dimensions: Dimensions;
    styles: {
        custom?: {};
        bsClasses?: {};
    };
}

export abstract class Widget {
    protected objectType = 'Widget';
    protected widgetType: WidgetType;
    protected properties: Properties = {
        dimensions: null,
        styles: {
            custom: {},
            bsClasses: {}
        }
    };
    protected position: Position = {
        top: 0,
        left: 0
    };
    protected meta: Meta; // id of the form 'clicheid_widgetid'
    protected isTemplate = false;
    // If this is a template, keep a reference to all is copies.
    // If the template is changed, propagate the changes to the template copies.
    protected templateCopies: Set<string> = new Set();

    /**
     * Given a map of clicheIds to all their widgets, adds a widget to that map.
     * @param allCliches a map of clicheids to cliches
     * @param widget widget to add
     */
    static addWidgetToCliche(
        allCliches: Map<string, Cliche>,
        widget: Widget) {
        if (!allCliches[widget.getClicheId()]) {
            throw Error('Cliche not found');
        }
        (<UserCliche>allCliches.get(widget.getClicheId())).addUnusedWidget(widget);
    }

    /**
     * Given a widgetId, gets the widget object from the map of all widgets
     * @param allCliches a map of all widgets
     * @param widgetId id of widget to find
     */
    static getWidget(
        allCliches: Map<string, Cliche>,
        widgetId: string
    ): Widget {
        const clicheid = Widget.decodeid(widgetId)[0];
        return allCliches[clicheid].getWidget(widgetId);
    }

    /**
     * Converts a JSON object to a Widget object
     * @param object object to convert
     */
    static fromObject(object: any): BaseWidget | UserWidget {
        const notCorrectObject = 'Object is not an instance of a Widget';
        if (object.widgetType === undefined || object.widgetType === null) {
            throw Error(notCorrectObject);
        }
        if (object.widgetType === WidgetType.BASE_WIDGET) {
            return BaseWidget.fromObject(object);
        }
        return UserWidget.fromObject(object);
    }

    static encodeid(clicheid: string, widgetid: string): string {
        return clicheid + '_' + widgetid;
    }

    static decodeid(id: string): string[] {
        return id.split('_');
    }

    /**
     * Makes a copy of the widget and returns a list of copies of this widget
     * and all inner widgets
     * @param allCliches map containing all cliches
     * @param fromTemplate Whether of not we are doing a "template" copy as
     *  opposed to a normal copy
     */
    abstract makeCopy(
        allCliches: Map<string, Cliche>,
        fromTemplate: boolean
    ): Widget[];

    protected newIdFromId(id: string) {
        const clicheid = Widget.decodeid(id)[0];
        return clicheid + '_' + generateId();
    }

    getId(): string {
        return this.meta.id;
    }

    getName(): string {
        return this.meta.name;
    }

    getDimensions(): Dimensions {
        return JSON.parse(JSON.stringify(this.properties.dimensions));
    }

    updateDimensions(newDimensions: Dimensions) {
        this.properties.dimensions = newDimensions;
    }

    getClicheId(): string {
        return this.meta.clicheId;
    }

    getTemplateId(): string {
        return this.meta.templateId;
    }

    getWidgetType(): WidgetType {
        return this.widgetType ;
    }

    getIsTemplate(): boolean {
        return this.isTemplate;
    }

    getIsTemplateCopy(widgetId: string) {
        return this.isTemplate && this.templateCopies.has(widgetId);
    }

    getLocalCustomStyles() {
        return JSON.parse(JSON.stringify(this.properties.styles.custom));
    }

    getPosition(): Position {
        return JSON.parse(JSON.stringify(this.position));
    }

    updatePosition(newPosition: Position) {
        this.position = JSON.parse(JSON.stringify(newPosition));
    }

    updateCustomStyle(styleName: string, value) {
        this.properties.styles.custom[styleName] = value;
    }

    removeCustomStyle(styleName: string) {
        delete this.properties.styles.custom[styleName];
    }

    /**
     * "Inherits" the styles of parent widgets and template widgets and returns
     * the styles that apply to this widget.
     * Order of preference: parent < template < own
     *
     * @param allCliches a map of all cliches
     * @param parentStyles any styles to inherit from the ancestors
     */
    getCustomStylesToShow(
        allCliches: Map<string, Cliche>,
        parentStyles = {}
    ) {
        // TODO: later on, use this to update a "stylesToShow" field
        // that is read when rendering, and updated whenever a template is
        // updated. If the field is there, just read from it, if not recursively
        // create it.
        const styles = JSON.parse(JSON.stringify(parentStyles));

        let inheritedStyles = {};
        if (this.getTemplateId()) {
            inheritedStyles = Widget
                .getWidget(allCliches, this.getTemplateId())
                .getCustomStylesToShow(allCliches); // no parent styles for template
        }

        for (const style of Object.keys(inheritedStyles)){
            styles[style] = inheritedStyles[style];
        }

        // this widgets styles win!
        for (const style of Object.keys(this.properties.styles.custom)){
            styles[style] = this.properties.styles.custom[style];
        }

        return styles;
    }

    /**
     * Just deletes from the all widgets table and the template reference if
     * it has one. Doesn't touch inner widgets if any.
     *
     * @param allCliches a map of all widgets
     */
    remove(allCliches: Map<string, Cliche>) {
        if (this.getTemplateId()) {
            Widget.getWidget(allCliches, this.getTemplateId()).templateCopies.delete(this.getId());
        }
        (<UserCliche>allCliches.get(this.getClicheId())).removeWidget(this.getId());
    }

    /**
     * Adds this widget to the map of all widgets.
     * @param allCliches the map of all cliches
     */
    addWidgetToCliche(allCliches: Map<string, Cliche>) {
        Widget.addWidgetToCliche(allCliches, this);
    }
}

/**
 * Base Widget model
 * @param type
 * @param widgets
 * @constructor
 */
export class BaseWidget extends Widget {
    protected widgetType = WidgetType.BASE_WIDGET;
    private type: string;
    private value: string;

    static fromObject(object: any): BaseWidget {
        if (object.widgetType !== WidgetType.BASE_WIDGET) {
            return null;
        }
        const clicheId = Widget.decodeid(object.meta.id)[0];
        return new BaseWidget(
            object.meta.name,
            object.properties.dimensions,
            object.type,
            object.value,
            clicheId,
            object.meta.id,
            object.meta.templateid,
            object.isTemplate);
    }

    constructor(
        name: string,
        dimensions: Dimensions,
        type: string,
        value: string,
        clicheid: string,
        id: string = null,
        templateid: string = null,
        isTemplate = false
    ) {
        super();
        this.meta = {
            name: name,
            clicheId: clicheid,
            id: id ? id : clicheid + '_' + generateId(),
            templateId: templateid,
            version: '',
            author: ''
        };
        this.type = type;
        this.value = value;
        this.properties.dimensions = dimensions;
        this.isTemplate = isTemplate;
    }

    setValue(value) {
        this.value = value;
    }

    makeCopy(
        allCliches: Map<string, Cliche>,
        fromTemplate = false
    ): Widget[] {
        let templateId = this.getTemplateId();
        const isTemplateCopy = fromTemplate && this.isTemplate;
        let isTemplate = this.isTemplate;
        if (isTemplateCopy) {
            // If you're making a tempate copy, you only make non-templates
            templateId = this.getId();
            isTemplate = false;
        }
        const copyWidget = new BaseWidget(
            this.getName(),
            this.getDimensions(),
            this.type,
            this.value,
            this.getClicheId(),
            null, // generate a new id!
            templateId,
            isTemplate);
        copyWidget.updatePosition(this.getPosition());
        if (isTemplateCopy) {
            // If you're making a tempate copy, add to template copies
            this.templateCopies.add(copyWidget.getId());
        }
        return [copyWidget];
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
    protected widgetType  = WidgetType.USER_WIDGET;
    private innerWidgetIds: string[] = []; // Widget ids // earlier in list == lower in z axis

    static fromObject(object: any): UserWidget {
        if (object.widgetType !== WidgetType.USER_WIDGET) {
            return null;
        }
        const clicheId = Widget.decodeid(object.meta.id)[0];
        const widget = new UserWidget(
            object.meta.name,
            object.properties.dimensions,
            clicheId,
            object.meta.id,
            object.meta.templateId,
            object.isTemplate);
        object.innerWidgetIds.forEach((id) => {
            widget.addInnerWidget(id);
        });

        return widget;
    }

    constructor(
        name: string,
        dimensions: Dimensions,
        clicheid: string,
        id: string = null,
        templateid: string = null,
        isTemplate = false
    ) {
        super();

        this.meta = {
            name: name,
            id: id ? id : clicheid + '_' + generateId(),
            templateId: templateid,
            version: '',
            author: ''
        };
        this.properties.dimensions = dimensions;
        this.isTemplate = isTemplate;
    }

    updateDimensions(newDimensions: Dimensions) {
        this.properties.dimensions = newDimensions;
    }

    addInnerWidget(id: string) {
        // Now the inner widgets list is the stack order
        this.innerWidgetIds.push(id);
    }

    removeInnerWidget(id: string) {
        const index = this.innerWidgetIds.indexOf(id);
        this.innerWidgetIds.splice(index, 1);
    }

    getInnerWidgetIds() {
        return this.innerWidgetIds.slice();
    }

    /**
     * Returns path starting from this id to the wanted widget id
     *  null if no path exists
     *
     * @param allCliches map of all cliches
     * @param widget widget we are currently looking at
     * @param targetId widget id of widget to find
     */
    private getPathHelper(
        allCliches: Map<string, Cliche>,
        widget: Widget,
        targetId: string
    ): string[] | null {
        const widgetId = widget.getId();
        // Base case 1: found it
        if (widgetId === targetId) {
            return [widgetId];
        }
        // Base case 2: reached a BaseWidget without finding it
        if (widget.getWidgetType() === WidgetType.BASE_WIDGET) {
            return null;
        }
        // Recursive case, look through all the inner widgets
        for (const id of (<UserWidget>widget).innerWidgetIds) {
            const path = this.getPathHelper(allCliches,
                Widget.getWidget(allCliches, id), targetId);
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
     * @param allCliches map of all widgets
     * @param widgetId widget id of widget to find
     */
    getPath(
        allCliches: Map<string, Cliche>,
        widgetId: string
    ): string[] | null {
        return this.getPathHelper(allCliches, this, widgetId);
    }

    /**
     * Returns the wanted widget if it is a child of this widget, else null
     *
     * @param allCliches map of all widgets
     * @param targetId id of widget to find
     * @param getParent whether to actually only get the parent of the widget
     */
    getInnerWidget(
        allCliches: Map<string, Cliche>,
        targetId: string,
        getParent = false
    ): Widget {
        const path = this.getPath(allCliches, targetId);
        if (path === null) { // it's not actually a child
            return null;
        }
        if (getParent) {
            targetId = path[path.length - 2];
        }
        return Widget.getWidget(allCliches, targetId);
    }

    /**
     *
     * @param allCliches
     * @param fromTemplate if this widget is not a template, this value is
     * ignored
     */
    makeCopy(
        allCliches: Map<string, Cliche>,
        fromTemplate = false
    ): Widget[] {
        let templateId = this.getTemplateId();
        let isTemplate = this.isTemplate;
        const isTemplateCopy = fromTemplate && this.isTemplate;
        if (isTemplateCopy) {
            // If you're making a tempate copy, you only make non-templates
            templateId = this.getId();
            isTemplate = false;
        }
        const copyWidget = new UserWidget(
            this.getName(),
            this.getDimensions(),
            this.getClicheId(),
            null, // generate a new id!
            templateId,
            isTemplate);
        copyWidget.updatePosition(this.getPosition());
        if (isTemplateCopy) {
            // If you're making a tempate copy, add it to template copy list
            this.templateCopies.add(copyWidget.getId());
        }

        let copyWidgets = [copyWidget];
        for (const id of this.innerWidgetIds) {
            const copyInnerWidgets = <UserWidget[]> Widget.getWidget(allCliches, id).makeCopy(allCliches, fromTemplate);
            const innerWidgetCopy = copyInnerWidgets[0];
            copyWidget.addInnerWidget(innerWidgetCopy.getId());
            copyWidgets = copyWidgets.concat(copyInnerWidgets);
        }
        return copyWidgets;
    }

    putInnerWidgetOnTop(widgetId: string) {
        const topWidgetId = this.innerWidgetIds[this.innerWidgetIds.length - 1];
        this.changeInnerWidgetOrderByOne(widgetId, new Set([topWidgetId]));
    }

    /**
     * Given the widgets one inner widget overlaps with, it swaps it with the
     * closest next widget
     * @param widgetId widget to shift
     * @param overlappingWidgetIds widget it overlaps with
     * @param isUp whether to move up or down
     */
    changeInnerWidgetOrderByOne(
        widgetId: string, overlappingWidgetIds: Set<string>, isUp = true) {

        const stackOrder = this.innerWidgetIds;
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
     * @param allCliches map of widgets
     * @param targetWidget widget we are looking at
     */
    findOverlappingWidgets(
        allCliches: Map<string, Cliche>,
        targetWidget: Widget
    ): Set<string> {
        const overlappingWidgets = new Set();
        const targetTop = targetWidget.getPosition().top;
        const targetLeft = targetWidget.getPosition().left;
        const targetRight = targetLeft + targetWidget.getDimensions().width;
        const targetBottom = targetTop + targetWidget.getDimensions().height;

        const that = this;

        this.innerWidgetIds.forEach((widgetId) => {
            if (widgetId === targetWidget.getId()) {
                return;
            }
            const widget = Widget.getWidget(allCliches, widgetId);
            const top = widget.getPosition().top;
            const left = widget.getPosition().left;
            const right = left + widget.getDimensions().width;
            const bottom = top + widget.getDimensions().height;

            let overlap = false;

            [targetLeft, targetRight].forEach(function (x) {
                [targetTop, targetBottom].forEach(function (y) {
                    overlap = overlap ||  that.coordInBox(x, y, top, right, bottom, left);
                });
            });

            [left, right].forEach(function (x) {
                [top, bottom].forEach(function (y) {
                    overlap = overlap ||  that.coordInBox(x, y, targetTop, targetRight, targetBottom, targetLeft);
                });
            });

            if (overlap) {
                overlappingWidgets.add(widgetId);
            }
        });
        return overlappingWidgets;
    }

}
