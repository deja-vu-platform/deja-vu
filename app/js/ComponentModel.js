
/**
 * Component
 * @returns {Component}
 * @constructor
 */
function Component() {
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
BaseComponent.prototype = new Component();
BaseComponent.prototype.constructor = BaseComponent;
function BaseComponent(type, components) {
    this.type = type;
    this.components = components;
    this.properties = {};
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
 * @constructor
 */
ClicheComponent.prototype = new Component();
ClicheComponent.prototype.constructor = ClicheComponent;
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
    this.layout = {}; // this is to remember this sizes of different cells
};

ClicheComponent.prototype.addComponent = function(component, row, col) {
    if (!this.components.hasOwnProperty(row)) {
        this.components[row]={};
    }
    this.components[row][col]=component;
    return true;
};



selectedUserComponent = new ClicheComponent({rows: 3, cols: 3}, "name", 1, "version", "author");
//selectedUserComponent.addComponent({}, 2, 3);