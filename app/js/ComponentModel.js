
/**
 * Component
 * @returns {Component}
 * @constructor
 */
Component = function() {
    this.type = '';
    this.meta = {};
    this.dimensions = {};
    this.properties = {};
    this.components = {};
};




/**
 * Base Component model
 * @param type
 * @param parentComponent
 * @param row
 * @param col
 * @constructor
 */
BaseComponent = function(type, components) {
    this.type = type;
    this.components = components;
    this.properties = {};
};

BaseComponent.prototype.setProperty = function(property, value) {
    this.properties[property] = value;
};
BaseComponent.prototype.updateComponent = function(component, value) {
    this.properties[component] = value;
};

BaseComponent.prototype = new Component();
BaseComponent.prototype.constructor = BaseComponent;





/**
 *
 * @param dimensions
 * @param name
 * @param id
 * @param version
 * @param author
 * @constructor
 */
function ClicheComponent(dimensions, name, id, version, author) {
    this.type = "cliche";
    this.meta = {
        name: name,
        id: id,
        version: version,
        author: author
    };
    this.dimensions = dimensions;
    this.components = {};
    this.properties = {};
};

ClicheComponent.prototype.addComponent = function(component, row, col) {
    if (!this.components.hasOwnProperty(row)) {
        this.components[row]={};
    }
    this.components[row][col]=component;
};

ClicheComponent.prototype = new Component();
ClicheComponent.prototype.constructor = ClicheComponent;


