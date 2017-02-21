/**
 * Created by Shinjini on 9/26/2016.
 */
/** ** ** ** Constants ** ** ** **/
const DEFAULT_SCREEN_WIDTH = 2500;
const DEFAULT_SCREEN_HEIGHT = 1000;

const DEFAULT_COMPONENT_NAME = "New Widget";
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
        id: generateId(),
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

var UserData = function(dimensions, name, id, version, author){
    // id
    // children = instances
    // properties // tree of changes
    //

    var template = Object.create(UserData.prototype);

    template.objectType = "UserData";
    template.type = "user";
    template.meta = {
        name: name,
        id: id,
        version: version,
        author: author
    };

    template.innerWidgets = {
        // widgetId: UserWidgetInstance
    };

    template.properties = {
        dimensions: dimensions,
        layout: {
            stackOrder: []
        },
        styles : {
            custom: {}, bsClasses: {}
        },
        children: {}
    };

    template.idMap = {};

    return template;
};

// var UserWidgetInstance = function(parentId){
//     var instance = Object.create(UserWidgetInstance);
//
//     instance.parentId = parentId;
//     instance.id = 123; // generate ID here
//
//     // parent id = template
//     // id
//     // children = instances
//     // properties // tree of changes
//
//
//     return instance;
// };

// var instantiateProperties = function(){
//     return {
//         properties : {
//             layout: {
//                 stackOrder: []
//             },
//
//             styles : {
//                 custom: {}, bsClasses: {}
//             }
//         },
//         children: {}
//     };
// };

// Tree of Changes
// widgetInstanceId:{ (= top level Id of the current widget)
//     properties : {
//        layout : {
//              stackOrder: []
//        },
//        styles : {
//              custom: {}, bsClasses: {}
//        }
//     },
//     children:{
//          widgetInstanceId:{
//                properties : changes,
//                  children: {
//                    widgetInstanceId:{
//                      ...
//                    },
//                     widgetInstanceId:{
//                       ...
//                     }
//              },
// 		    ...
//      }
//
// },
//


UserData.prototype.addInnerWidget = function(widget) {
    var widgetId = widget.meta.id;
    this.innerWidgets[widgetId]=widget;
    this.properties.layout.stackOrder.push(widgetId);
    return true;
};


UserData.prototype.deleteInnerWidget = function(widgetId) {
    delete this.innerWidgets[widgetId];
    delete this.properties.layout[widgetId];
    var index = this.properties.layout.stackOrder.indexOf(widgetId);
    this.properties.layout.stackOrder.splice(index, 1);
    return true;
};

UserData.fromString = function(string){
    var object = JSON.parse(string);
    return UserData.fromObject(object)
};

UserData.fromObject = function(object){
    // Check that the object has all the required fields
    var notCorrectObjectError = "notCorrectObjectError: object object is not an instance of a UserData";
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

    return $.extend(new UserData(object.dimensions), object)
};
