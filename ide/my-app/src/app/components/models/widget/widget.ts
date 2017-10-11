import { generateId, Dimensions } from '../../common/utility/utility';

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
    layout?: {
        stackOrder: number[];
    };
}

interface Meta {
    name: string;
    id: number;
    version?: string;
    author?: string;
}

export class Widget {
    objectType: WidgetType;
    properties: Properties;
    meta: Meta;
}

/**
 * Base Widget model
 * @param type
 * @param widgets
 * @constructor
 */
export class BaseWidget extends Widget {
    objectType = WidgetType.BASE_WIDGET;
    meta = {
        name: '',
        id: generateId(),
        version: '',
        author: ''
    };
    type: string;
    value: string;

    BaseWidget(type: string, value: string, dimensions: Dimensions) {
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
    objectType = WidgetType.USER_WIDGET;
    type = 'user';
    innerWidgetIds: number[]; // Widget ids
    // widgetId: UserWidgetInstance

    overrideProperties = {
        styles: {
            custom: {}, bsClasses: {}
        }
    };

    static fromString(string) {
        const object = JSON.parse(string);
        return UserWidget.fromObject(object);
    }

    static fromObject(object) {
        return fromObjectHelper(object);
    }

    UserWidget(dimensions, name, id, version, author) {
        // id
        // children = instances
        // properties // tree of changes
        //

        this.meta = {
            name: name,
            id: id,
            version: version,
            author: author
        };
        this.properties.dimensions = dimensions;
        this.properties.layout = {
            stackOrder: []
        };
    }

    addInnerWidget(widgetId: number) {
        // Now the inner widgets list is the stack order
        this.innerWidgetIds.push(widgetId);
        this.properties.layout[widgetId] = { top: '0px', left: '0px' };
    }

    deleteInnerWidget(widgetId) {
        delete this.properties.layout[widgetId];
        const index = this.innerWidgetIds.indexOf(widgetId);
        this.innerWidgetIds.splice(index, 1);
    }

    private getPathHelper(allWidgets, widget: Widget, targetId: number): number[]|null {
        // returns path starting from this id to the wanted widget id
        // null if no path exists

        const widgetId = widget.meta.id;
        // Base case 1: found it
        if (widgetId === targetId) {
            return [widgetId];
        }
        // Base case 2: reached a BaseWidget without finding it
        if (widget.objectType === WidgetType.BASE_WIDGET) {
            return null;
        }
        // Recursive case, look through all the inner widgets
        for (const id of (<UserWidget>widget).innerWidgetIds) {
            const path = this.getPathHelper(allWidgets, allWidgets[id], targetId);
            if (path === null) {
                continue;
            }
            // else, we've found it! return
            return [widgetId].concat(path);
        }
        // didn't find anything...
        return null;
    }

    getPath(allWidgets, widgetId: number): number[]|null {
        // returns path starting from this id to the wanted widget id
        // null if no path exists
        return this.getPathHelper(allWidgets, this, widgetId);
    }

    private getInnerWidgetHelper(allWidgets, widget: Widget, targetId: number): Widget|null {
        // return null if the widget can't be found

        const widgetId = widget.meta.id;

        // Base case 1: found it
        if (widgetId === targetId) {
            return widget;
        }
        // Base case 2: reached a BaseWidget without finding it
        if (widget.objectType === WidgetType.BASE_WIDGET) {
            return null;
        }
        for (const id of (<UserWidget>widget).innerWidgetIds) {
            const targetWidget = this.getInnerWidgetHelper(
                allWidgets, allWidgets[id], targetId);
            if (targetWidget !== null) {
                return targetWidget;
            }
        }
        // Haven't found it
        return null;
    }

    getInnerWidget(allWidgets, targetId: number, forParent: boolean) {
        if (this.meta.id === targetId) {
            return this;
        }
        if (forParent) {
            const path = this.getPath(allWidgets, targetId);
            if (path === null) {
                return null;
            }
            targetId = path[path.length - 2];
        }
        return this.getInnerWidgetHelper(allWidgets, this, targetId);
    }


    // keepStructure: Returns a nested list structure representing the structure of usage
    // recursive structure [widgetId, [recursive structure of children]]
    // expanded structure: [[id1, []], [id2, []], [id3, [recursive ids of children of id3]], [id4,[recursive children of ld4]]]
    getAllInnerWidgetsIds(keepStructure) {
        const innerWidgetsInfoListLinearlized = [];
        const getInnerWidgetInfo = function (widget) {
            const outerRecursiveChildrenIds = [];
            if (widget.type === 'user') {
                for (const innerWidgetId of Object.keys(widget.innerWidgets)) {
                    const innerWidget = widget.innerWidgets[innerWidgetId];
                    innerWidgetsInfoListLinearlized.push(innerWidgetId);
                    const recursiveChildrenIds = getInnerWidgetInfo(innerWidget);
                    outerRecursiveChildrenIds.push([innerWidgetId, recursiveChildrenIds]);
                }
            }
            return outerRecursiveChildrenIds;
        };

        const innerWidgetsInfoListStructured = getInnerWidgetInfo(this);

        if (keepStructure) {
            return innerWidgetsInfoListStructured;
        } else {
            return innerWidgetsInfoListLinearlized;
        }
    }
}

const fromObjectHelper = function (object) {
    // Check that the object has all the required fields
    const notCorrectObjectError = 'notCorrectObjectError: object object is not an instance of a UserWidget';
    if (!object.objectType) {
        throw notCorrectObjectError;
    }
    if (!object.meta) {
        throw notCorrectObjectError;
    }
    if (!object.properties) {
        throw notCorrectObjectError;
    }
    if (!object.type) {
        throw notCorrectObjectError;
    }
    if (object.type !== 'user') {
        return $.extend(new BaseWidget(), object);
    }
    if (!object.innerWidgets) {
        throw notCorrectObjectError;
    }

    for (const widgetId of Object.keys(object.innerWidgets)) {
        object.innerWidgets[widgetId] = fromObjectHelper(object.innerWidgets[widgetId]);
    }

    return $.extend(new UserWidget(), object);
};

