import { generateId, Dimensions, Position } from '../../components/common/utility/utility';

/** ** ** ** Constants ** ** ** **/
const DEFAULT_SCREEN_WIDTH = 2500;
const DEFAULT_SCREEN_HEIGHT = 1000;

const DEFAULT_WIDGET_NAME = 'New Widget';
/** ** ** ** ** ** ** ** ** ** **/

export enum WidgetType {
    BASE_WIDGET, USER_WIDGET, CLICHE_WIDGET
}

export interface Properties {
    dimensions: Dimensions;
    styles: {
        custom?: {};
        bsClasses?: {};
    };
    layout?: Map<number, Position>;
}

interface Meta {
    name: string;
    id: string; // id of the form 'clicheid_widgetid'
    templateid?: string;
    version?: string;
    author?: string;
}

export class Widget {
    protected widgetType: WidgetType;
    protected properties: Properties = {
        dimensions: null,
        styles: {
            custom: {},
            bsClasses: {}
        }
    };
    protected meta: Meta;
    protected isTemplate = false;
    // if this is a template, keep a reference to all is copies
    protected templateCopies: Set<string> = new Set();

    static addWidgetToAllWidgets(
        allWidgets: Map<string, Map<string, Widget>>,
        widget: Widget) {
        if (!allWidgets[widget.getClicheId()]) {
            allWidgets[widget.getClicheId()] = new Map<string, Widget>();
        }
        allWidgets[widget.getClicheId()][widget.getId()] = widget;
    }

    static getWidget(
        allWidgets: Map<string, Map<string, Widget>>,
        widgetId: string
    ) {
        const clicheid = Widget.decodeid(widgetId)[0];
        return allWidgets[clicheid][widgetId];
    }

    static fromObject(object: any): BaseWidget | UserWidget {
        const notCorrectObjectError = 'notCorrectObjectError: ' +
        'object object is not an instance of a Widget';
        if (object.widgetType === undefined || object.widgetType === null) {
            throw notCorrectObjectError;
        }
        if (object.widgetType === WidgetType.BASE_WIDGET) {
            return BaseWidget.fromObject(object);
        }
        return UserWidget.fromObject(object);
    }

    static encodeid(clicheid: string, widgetid: string) {
        return clicheid + '_' + widgetid;
    }

    static decodeid(id: string) {
        return id.split('_');
    }

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
        return this.properties.dimensions;
    }

    updateDimensions(newDimensions: Dimensions) {
        this.properties.dimensions = newDimensions;
    }

    getClicheId(): string {
        return Widget.decodeid(this.meta.id)[0];
    }

    getTemplateId(): string {
        return this.meta.templateid;
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

    updateCustomStyle(styleName: string, value) {
        this.properties.styles.custom[styleName] = value;
    }

    removeCustomStyle(styleName: string) {
        delete this.properties.styles.custom[styleName];
    }

    /**
     * Order of preference: parent < template < own
     * @param allWidgets
     * @param parentStyles
     */
    getCustomStylesToShow(
        allWidgets: Map<string, Map<string, Widget>>,
        parentStyles = {}
    ) {
        // TODO: later on, use this to update a "stylesToShow" field
        // that is read when rendering, and updated whenever a template is
        // updated. If the field is there, just read from it, if not recursively
        // create it.
        const styles =
            JSON.parse(JSON.stringify(parentStyles));

        let inheritedStyles = {};
        if (this.getTemplateId()) {
            inheritedStyles =
                Widget.getWidget(allWidgets, this.getTemplateId()).getCustomStylesToShow();
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
     */
    delete(allWidgets: Map<string, Map<string, Widget>>) {
        if (this.getTemplateId()) {
            Widget.getWidget(allWidgets, this.getTemplateId()).templateCopies.delete(this.getId());
        }
        delete allWidgets[this.getClicheId()][this.getId()];
    }

    addWidgetToAllWidgets(allWidgets: Map<string, Map<string, Widget>>) {
        Widget.addWidgetToAllWidgets(allWidgets, this);
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
            id: id ? id : clicheid + '_' + generateId(),
            templateid: templateid,
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
        allWidgets: Map<string, Map<string, Widget>>,
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
    private innerWidgetIds: string[] = []; // Widget ids

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
            templateid: templateid,
            version: '',
            author: ''
        };
        this.properties.dimensions = dimensions;
        this.properties.layout = new Map<number, Position>();
        this.isTemplate = isTemplate;
    }

    updateDimensions(newDimensions: Dimensions) {
        this.properties.dimensions = newDimensions;
    }

    addInnerWidget(id: string, position?: Position) {
        // Now the inner widgets list is the stack order
        this.innerWidgetIds.push(id);
        this.properties.layout[id] = position ? position : { top: 0, left: 0 };
    }

    removeInnerWidget(id: string) {
        delete this.properties.layout[id];
        const index = this.innerWidgetIds.indexOf(id);
        this.innerWidgetIds.splice(index, 1);
    }

    getInnerWidgetIds() {
        return this.innerWidgetIds.slice();
    }

    updateInnerWidgetLayout(widgetId: string, newLayout: Position) {
        this.properties.layout[widgetId] = newLayout;
    }

    getInnerWidgetLayouts() {
        return JSON.parse(JSON.stringify(this.properties.layout));
    }

    private getPathHelper(
        allWidgets: Map<string, Map<string, Widget>>,
        widget: Widget,
        targetId: string
    ): string[] | null {
        // returns path starting from this id to the wanted widget id
        // null if no path exists

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
            const path = this.getPathHelper(allWidgets,
                Widget.getWidget(allWidgets, id), targetId);
            if (path === null) {
                continue;
            }
            // else, we've found it! return
            return [widgetId].concat(path);
        }
        // didn't find anything...
        return null;
    }

    getPath(
        allWidgets: Map<string, Map<string, Widget>>,
        widgetId: string
    ): string[] | null {
        // returns path starting from this id to the wanted widget id
        // null if no path exists
        return this.getPathHelper(allWidgets, this, widgetId);
    }

    getInnerWidget(
        allWidgets: Map<string, Map<string, Widget>>,
        targetId: string,
        getParent = false
    ): Widget {
        const path = this.getPath(allWidgets, targetId);
        if (path === null) { // it's not actually a child
            return null;
        }
        if (getParent) {
            targetId = path[path.length - 2];
        }
        return Widget.getWidget(allWidgets, targetId);
    }

    /**
     *
     * @param allWidgets
     * @param fromTemplate if this widget is not a template, this value is
     * ignored
     */
    makeCopy(
        allWidgets: Map<string, Map<string, Widget>>,
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
        if (isTemplateCopy) {
            // If you're making a tempate copy, add it to template copy list
            this.templateCopies.add(copyWidget.getId());
        }

        let copyWidgets = [copyWidget];
        for (const id of this.innerWidgetIds) {
            const copyInnerWidgets = Widget.getWidget(allWidgets, id).makeCopy(allWidgets, fromTemplate);
            const innerWidgetCopy = copyInnerWidgets[0];
            const position = this.properties.layout[id];
            copyWidget.addInnerWidget(innerWidgetCopy.getId(), position);
            copyWidgets = copyWidgets.concat(copyInnerWidgets);
        }
        return copyWidgets;
    }

}

/**
     * Don't think this will be needed
    private getInnerWidgetInfo(
        allWidgets: Map<string, Map<string, Widget>>,
        widget: Widget,
        infoListLinearlized
    ) {
        const outerRecursiveChildrenIds = [];
        if (widget.getWidgetType() === WidgetType.USER_WIDGET) {
            for (const innerWidgetId of (<UserWidget>widget).innerWidgetIds) {
                const innerWidget: Widget = Widget.getWidget(allWidgets, innerWidgetId);
                infoListLinearlized.push(innerWidgetId);
                const recursiveChildrenIds = this.getInnerWidgetInfo(
                    allWidgets,
                    innerWidget, infoListLinearlized);
                outerRecursiveChildrenIds
                    .push([innerWidgetId, recursiveChildrenIds]);
            }
        }
        return outerRecursiveChildrenIds;
    }

    // keepStructure: Returns a nested list structure representing the
    // structure of usage
    // recursive structure [widgetId, [recursive structure of children]]
    // expanded structure: [[id1, []], [id2, []], [id3, [recursive ids of
    // children of id3]], [id4,[recursive children of ld4]]]
    getAllInnerWidgetsIds(
        allWidgets: Map<string, Map<string, Widget>>,
        keepStructure: boolean
    ) {
        const infoListLinearlized = [];
        const infoListStructured = this
                    .getInnerWidgetInfo(allWidgets, this, infoListLinearlized);

        if (keepStructure) {
            return infoListStructured;
        } else {
            return infoListLinearlized;
        }
    }
    */
