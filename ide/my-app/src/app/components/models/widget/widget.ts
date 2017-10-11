import { generateId, Dimensions, Position } from '../../common/utility/utility';

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
        styles: {}
    };
    protected meta: Meta;

    static fromObject(object: any): BaseWidget | UserWidget {
        const notCorrectObjectError = 'notCorrectObjectError: ' +
        'object object is not an instance of a UserWidget';
        if (!object.widgetType ) {
            throw notCorrectObjectError;
        }
        if (object.widgetType  === WidgetType.BASE_WIDGET) {
            return BaseWidget.fromObject(object);
        }
        return UserWidget.fromObject(object);
    }

    protected encodeid(clicheid: string, widgetid: string) {
        return clicheid + '_' + widgetid;
    }

    protected decodeid(idstr: string) {
        return idstr
            .split('_');
    }

    getId(): string {
        return this.meta.id;
    }

    getClicheId(): string {
        return this.decodeid(this.meta.id)[0];
    }

    getTemplayeId(): string {
        return this.meta.templateid;
    }

    getWidgetType(): WidgetType {
        return this.widgetType ;
    }
}

/**
 * Base Widget model
 * @param type
 * @param widgets
 * @constructor
 */
export class BaseWidget extends Widget {
    protected widgetType  = WidgetType.BASE_WIDGET;
    private type: string;
    private value: string;

    static fromObject(object: any): BaseWidget {
        if (object.widgetType  !== WidgetType.BASE_WIDGET) {
            return null;
        }
        const widget = new BaseWidget(null, null, null, null, null);
        widget.type = object.type;
        widget.value = object.value;
        widget.meta = object.meta;
        widget.properties = object.properties;
        return widget;
    }

    constructor(
        name: string,
        dimensions: Dimensions,
        type: string,
        value: string,
        clicheid: string,
        templateid: string = null) {
        super();
        this.meta = {
            name: name,
            id: clicheid + '_' + generateId(),
            templateid: templateid,
            version: '',
            author: ''
        };
        this.type = type;
        this.value = value;
        this.properties.dimensions = dimensions;
    }

    setProperty(property, value) {
        this.properties[property] = value;
    }

    setValue(value) {
        this.value = value;
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
        if (object.widgetType  !== WidgetType.USER_WIDGET) {
            return null;
        }
        const widget = new UserWidget(null, null, null);
        widget.innerWidgetIds = object.innerWidgetIds;
        widget.meta = object.meta;
        widget.properties = object.properties;
        return widget;
    }

    constructor(
        name: string,
        dimensions: Dimensions,
        clicheid: string,
        templateid: string = null) {
        super();
        this.meta = {
            name: name,
            id:  clicheid + '_' + generateId(),
            templateid: templateid,
            version: '',
            author: ''
        };
        this.properties.dimensions = dimensions;
        this.properties.layout = new Map<number, Position>();
    }

    addInnerWidget(id: string) {
        // Now the inner widgets list is the stack order
        this.innerWidgetIds.push(id);
        this.properties.layout[id] = { top: 0, left: 0 };
    }

    removeInnerWidget(id: string) {
        delete this.properties.layout[id];
        const index = this.innerWidgetIds.indexOf(id);
        this.innerWidgetIds.splice(index, 1);
    }

    getInnerWidgets() {
        return this.innerWidgetIds.slice();
    }

    private getPathHelper(
        allWidgets: Map<string, Map<string, Widget>>,
        widget: Widget,
        targetId: string):
    string[] | null {
        // returns path starting from this id to the wanted widget id
        // null if no path exists

        const widgetId = widget.getId();
        // Base case 1: found it
        if (widgetId === targetId) {
            return [widgetId];
        }
        // Base case 2: reached a BaseWidget without finding it
        if (widget.getWidgetType()  === WidgetType.BASE_WIDGET) {
            return null;
        }
        // Recursive case, look through all the inner widgets
        for (const id of (<UserWidget>widget).innerWidgetIds) {
            const clicheid = this.decodeid(id)[0];
            const path = this.getPathHelper(allWidgets,
                allWidgets[clicheid][id], targetId);
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
        widgetId: string):
    string[] | null {
        // returns path starting from this id to the wanted widget id
        // null if no path exists
        return this.getPathHelper(allWidgets, this, widgetId);
    }

    getInnerWidget(
        allWidgets: Map<string, Map<string, Widget>>,
        targetId: string,
        forParent = false):
    Widget {
        const path = this.getPath(allWidgets, targetId);
        if (path === null) { // it's not actually a child
            return null;
        }
        if (forParent) {
            targetId = path[path.length - 2];
        }
        const targetClicheId = this.decodeid(targetId)[0];
        return allWidgets[targetClicheId][targetId];
    }

    private getInnerWidgetInfo(
        allWidgets: Map<string, Map<string, Widget>>,
        widget: Widget,
        infoListLinearlized) {
        const outerRecursiveChildrenIds = [];
        if (widget.getWidgetType() === WidgetType.USER_WIDGET) {
            for (const innerWidgetId of (<UserWidget>widget).innerWidgetIds) {
                const innerWidgetClicheId = this.decodeid(innerWidgetId)[0];
                const innerWidget: Widget = allWidgets[innerWidgetClicheId][innerWidgetId];
                infoListLinearlized.push(innerWidgetId);
                const recursiveChildrenIds = this.getInnerWidgetInfo(allWidgets,
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
        keepStructure: boolean) {
        const infoListLinearlized = [];
        const infoListStructured = this.getInnerWidgetInfo(allWidgets,
            this, infoListLinearlized);

        if (keepStructure) {
            return infoListStructured;
        } else {
            return infoListLinearlized;
        }
    }
}
