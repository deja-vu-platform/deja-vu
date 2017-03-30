/**
 * Created by Shinjini on 9/26/2016.
 */
/** ** ** ** Constants ** ** ** **/
const DEFAULT_SCREEN_WIDTH = 2500;
const DEFAULT_SCREEN_HEIGHT = 1000;

const DEFAULT_WIDGET_NAME = "New Widget";
/** ** ** ** ** ** ** ** ** ** **/

// TODO eventually freeze the object and only allow updates using the objects!

/**
 * Base Widget model
 * @param type
 * @param widgets
 * @constructor
 */
var BaseWidget = function (type, widgets, dimensions) {
    var baseWidget = Object.create(BaseWidget.prototype);
    // TODO: later, change these to private variables

    baseWidget.objectType = "BaseWidget";
    baseWidget.type = type;
    baseWidget.innerWidgets = widgets;
    baseWidget.properties = {
        dimensions: dimensions,
        styles: {custom:{}, bsClasses: {}}
    };
    baseWidget.meta = {
        name: '',
        id: Utility().generateId(),
        version: '',
        author: ''
    };
    return baseWidget;
};

BaseWidget.prototype.setProperty = function(property, value) {
    this.properties[property] = value;
};
BaseWidget.prototype.updateWidget = function(type, value) {
    this.innerWidgets[type] = value;
};


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
var UserWidget = function(dimensions, name, id, version, author){
    // id
    // children = instances
    // properties // tree of changes
    //

    var that = Object.create(UserWidget.prototype);

    that.objectType = "UserWidget";
    that.type = "user";
    that.meta = {
        name: name,
        id: id,
        version: version,
        author: author
    };

    that.innerWidgets = {
        // widgetId: UserWidgetInstance
    };

    that.properties = {
        dimensions: dimensions,
        layout: {
            stackOrder: []
        },
        styles : {
            custom: {}, bsClasses: {}
        },
        children: {}
    };

    //Object.freeze(that);
    return that;
};

UserWidget.prototype.addInnerWidget = function(widget) {
    var widgetId = widget.meta.id;
    this.innerWidgets[widgetId]=widget;
    this.properties.layout.stackOrder.push(widgetId);
    return true;
};

UserWidget.prototype.deleteInnerWidget = function(widgetId) {
    delete this.innerWidgets[widgetId];
    delete this.properties.layout[widgetId];
    var index = this.properties.layout.stackOrder.indexOf(widgetId);
    this.properties.layout.stackOrder.splice(index, 1);
    return true;
};

UserWidget.prototype.getPath = function(widgetId){
    var outermostWidget = this;
    var wantedPath = [];
    var getPathHelper = function(widget, path, targetId){
        if (widget.meta){
            var widgetId = widget.meta.id;
            path.push(widgetId);
            if (widgetId == targetId){
                wantedPath = path;
            } else {
                for (var id in widget.innerWidgets){
                    getPathHelper(widget.innerWidgets[id], JSON.parse(JSON.stringify(path)), targetId);
                }
            }
        }
    };
    getPathHelper(outermostWidget, [], widgetId);
    return wantedPath;
};

UserWidget.prototype.getInnerWidget = function(targetId, forParent){
    var outermostWidget = this;
    if (forParent){
        var path = outermostWidget.getPath(targetId);
        targetId = path[path.length-2];
    }
    var wantedWidget = null;
    var getInnerWidgetHelper = function(widget, targetId){
        if (widget.meta){
            var widgetId = widget.meta.id;
            if (widgetId == targetId){
                wantedWidget = widget;
            } else {
                for (var id in widget.innerWidgets){
                    getInnerWidgetHelper(widget.innerWidgets[id], targetId);
                }
            }

        }
    };
    getInnerWidgetHelper(outermostWidget, targetId);
    if (wantedWidget){
        wantedWidget = UserWidget.fromObject(wantedWidget);
    }

    return wantedWidget;
};


// keepStructure: Returns a nested list structure representing the structure of usage
// recursive structure [widgetId, [recursive structure of children]]
// expanded structure: [[id1, []], [id2, []], [id3, [recursive ids of children of id3]], [id4,[recursive children of ld4]]]
UserWidget.prototype.getAllInnerWidgetsIds = function(keepStructure) {
    var innerWidgetsInfoListLinearlized = [];
    var getInnerWidgetInfo = function(widget){
        var outerRecursiveChildrenIds= [];
        for (var innerWidgetId in widget.innerWidgets){
            var innerWidget = widget.innerWidgets[innerWidgetId];
            innerWidgetsInfoListLinearlized.push(innerWidgetId);
            var recursiveChildrenIds = getInnerWidgetInfo(innerWidget);
            outerRecursiveChildrenIds.push([innerWidgetId, recursiveChildrenIds]);
        }
        return outerRecursiveChildrenIds
    };

    var innerWidgetsInfoListStructured = getInnerWidgetInfo(this);

    if (keepStructure){
        return innerWidgetsInfoListStructured;
    } else {
        return innerWidgetsInfoListLinearlized;
    }
};



UserWidget.fromString = function(string){
    var object = JSON.parse(string);
    return UserWidget.fromObject(object)
};

UserWidget.fromObject = function(object){
    // Check that the object has all the required fields
    var notCorrectObjectError = "notCorrectObjectError: object object is not an instance of a UserWidget";
    if (!object.objectType){
        throw notCorrectObjectError;
    }
    if (!object.type){
        throw notCorrectObjectError;
    }
    if (!object.meta){
        throw notCorrectObjectError;
    }
    if (!object.innerWidgets){
        throw notCorrectObjectError;
    }
    if (!object.properties){
        throw notCorrectObjectError;
    }

    return $.extend(new UserWidget(object.dimensions), object)
};
