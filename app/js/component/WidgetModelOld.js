/**
 * Created by Shinjini on 9/26/2016.
 */
/** ** ** ** Constants ** ** ** **/
const DEFAULT_SCREEN_WIDTH = 2500;
const DEFAULT_SCREEN_HEIGHT = 1000;

const DEFAULT_COMPONENT_NAME = "New Widget";
/** ** ** ** ** ** ** ** ** ** **/

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
    baseWidget.properties = {custom:{}, overall: {}, bsClasses: {}};
    baseWidget.meta = {
        name: '',
        id: generateId(),
        version: '',
        author: ''
    };
    baseWidget.dimensions = dimensions;
    baseWidget.layout = {}; // TODO
    return baseWidget;
}

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
var UserWidget = function (dimensions, name, id, version, author) {
    var userWidget = Object.create(UserWidget.prototype);
    // TODO: later, change these to private variables
    userWidget.objectType = "UserWidget";
    userWidget.type = "user";
    userWidget.meta = {
        name: name,
        id: id,
        version: version,
        author: author
    };
    userWidget.dimensions = dimensions; // dimension = { height: Number (px)
                                                            // width: Number (px) }
                                                            // == desired dimensions
                                                            // start at some default and then resize?
                                                            // different starting defaults for widget vs page!
    userWidget.innerWidgets = {}; // widgetId: widget
    // user outer widget should define where the inner widgets are
    userWidget.layout = {stackOrder : []}; // widgetId: { top: Number (px),
                                                // left: Number (px),

    userWidget.properties = {custom:{}, main: {}, bsClasses: {}};
    return userWidget
};

UserWidget.prototype.addInnerWidget = function(widget) {
    var widgetId = widget.meta.id;
    this.innerWidgets[widgetId]=widget;
    this.layout.stackOrder.push(widgetId);
    return true;
};


UserWidget.prototype.deleteInnerWidget = function(widgetId) {
    delete this.innerWidgets[widgetId];
    delete this.layout[widgetId];
    var index = this.layout.stackOrder.indexOf(widgetId);
    this.layout.stackOrder.splice(index, 1);
    return true;
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
    if (!object.dimensions){
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
