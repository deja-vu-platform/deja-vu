/**
 * Created by Shinjini on 9/26/2016.
 */
/** ** ** ** Constants ** ** ** **/
const DEFAULT_SCREEN_WIDTH = 2500;
const DEFAULT_SCREEN_HEIGHT = 1000;

const DEFAULT_COMPONENT_NAME = "New Component";
/** ** ** ** ** ** ** ** ** ** **/

/**
 * Base Component model
 * @param type
 * @param components
 * @constructor
 */
var BaseComponent = function (type, components, dimensions) {
    var baseComponent = Object.create(BaseComponent.prototype);
    // TODO: later, change these to private variables

    baseComponent.objectType = "BaseComponent";
    baseComponent.type = type;
    baseComponent.components = components;
    baseComponent.properties = {custom:{}, overall: {}};
    baseComponent.meta = {
        name: '',
        id: generateId(),
        version: '',
        author: ''
    };
    baseComponent.dimensions = dimensions;
    baseComponent.layout = {}; // TODO
    return baseComponent;
}

BaseComponent.prototype.setProperty = function(property, value) {
    this.properties[property] = value;
};
BaseComponent.prototype.updateComponent = function(type, value) {
    this.components[type] = value;
};


/**
 *
 * @param dimensions
 * @param name
 * @param id
 * @param version
 * @param author
 * @returns {UserComponent}
 * @constructor
 */
var UserComponent = function (dimensions, name, id, version, author) {
    var userComponent = Object.create(UserComponent.prototype);
    // TODO: later, change these to private variables
    userComponent.objectType = "UserComponent";
    userComponent.type = "user";
    userComponent.meta = {
        name: name,
        id: id,
        version: version,
        author: author
    };
    userComponent.dimensions = dimensions; // dimension = { height: Number (px)
                                                            // width: Number (px) }
                                                            // == desired dimensions
                                                            // start at some default and then resize?
                                                            // different starting defaults for component vs page!
    userComponent.components = {}; // componentId: component
    // user outer component should define where the inner components are
    userComponent.layout = {stackOrder : []}; // componentId: { top: Number (px),
                                                // left: Number (px),

    userComponent.properties = {custom:{}, overall: {}};
    return userComponent
};

UserComponent.prototype.addComponent = function(component) {
    var componentId = component.meta.id;
    this.components[componentId]=component;
    this.layout.stackOrder.push(componentId);
    return true;
};


UserComponent.prototype.deleteComponent = function(componentId) {
    delete this.components[componentId];
    var index = this.layout.stackOrder.indexOf(componentId);
    this.layout.stackOrder.splice(index, 1);
    return true;
};

UserComponent.fromString = function(string){
    var object = JSON.parse(string);
    return UserComponent.fromObject(object)
};

UserComponent.fromObject = function(object){
    // Check that the object has all the required fields
    var notCorrectObjectError = "notCorrectObjectError: object object is not an instance of a UserComponent";
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
    if (!object.components){
        throw notCorrectObjectError;
    }
    if (!object.properties){
        throw notCorrectObjectError;
    }

    return $.extend(new UserComponent(object.dimensions), object)
};
