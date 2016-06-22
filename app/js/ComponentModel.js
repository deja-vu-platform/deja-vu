/** ** ** ** Constants ** ** ** **/
const DEFAULT_ROWS = 3;
const DEFAULT_COLS = 3;
const DEFAULT_CELL_WIDTH = 250;
const DEFAULT_CELL_HEIGHT = 250;

const DEFAULT_COMPONENT_NAME = "New Component";
//const DEFAULT_AUTHOR = "Unknown"; Already defined
//const DEFAULT_VERSION = '0.0.1';
/** ** ** ** ** ** ** ** ** ** **/



/**
 * Component
 * @returns {Component}
 * @constructor
 */
function Component() {
    this.objectType = "Component";
    this.type = '';
    this.meta = {};
    this.dimensions = {};
    this.properties = {};
    this.components = {};
    this.layout = {}; // {row:
                        // {col:
                            // {spans: {row: Number ,col: Number},
                            // merged:{isMerged: Boolean, lastMergedBottomRightCellId: String},
                            // hidden:{isHidden: Boolean, hidingCellId: String}
                            // pxDimensions: {width: Number (ratio), height: Number (ratio)}
                            // }
                        // }
                      // }
}




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
    this.objectType = "BaseComponent";
    this.type = type;
    this.components = components;
    this.properties = {};
    this.meta = {
        name: '',
        id: '',
        version: '',
        author: ''
    };
    this.dimensions = {rows: 1, cols: 1};
    this.layout = {1:{
                    1:{
                        spans:{row:1,col:1},
                        merged:{isMerged: false, lastMergedBottomRightCellId: ''},
                        hidden:{isHidden: false, hidingCellId: ''},
                        pxDimensions: {width: 1, height: 1}
                    }
                   }};
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
UserComponent.prototype = new Component();
UserComponent.prototype.constructor = UserComponent;
function UserComponent(dimensions, name, id, version, author) {
    this.objectType = "UserComponent";
    this.type = "user";
    this.meta = {
        name: name,
        id: id,
        version: version,
        author: author
    };
    this.dimensions = dimensions;
    this.components = {};
    this.properties = {};
    this.layout = {tablePxDimensions:{isSet: false, width:-1, height:-1}}; // -1 means absolute width and height have not been set

    for (var row = 1; row<=dimensions.rows; row++){
        this.layout[row] = {};
        for (var col = 1; col<= dimensions.cols; col++){
            this.layout[row][col] = {
                                        spans:{row:1,col:1},
                                        merged:{isMerged: false, lastMergedBottomRightCellId: ''},
                                        hidden:{isHidden: false, hidingCellId: ''},
                                        // pxDimensions will be measured in %
                                        pxDimensions: {width: 1/dimensions.cols, height: 1/dimensions.rows},
            };
        }
    }
}

UserComponent.prototype.recalculateRatios = function(deltaRows, deltaCols){
    var dimensions = this.dimensions;
    for (var row = 1; row<=dimensions.rows; row++){
        for (var col = 1; col<= dimensions.cols; col++){
            if (this.layout[row][col].pxDimensions){
                this.layout[row][col].pxDimensions.width = this.layout[row][col].pxDimensions.width*(dimensions.cols-deltaCols)/dimensions.cols;
                this.layout[row][col].pxDimensions.height = this.layout[row][col].pxDimensions.height*(dimensions.rows-deltaRows)/dimensions.rows;
            } else {
                this.layout[row][col].pxDimensions = {};
                if (this.layout[row-1]){ // if there is a row before this, take the width of the cell to the top
                    this.layout[row][col].pxDimensions.width = this.layout[row-1][col].pxDimensions.width;
                } else { // otherwise have a standard width
                    this.layout[row][col].pxDimensions.width = 1/dimensions.cols;
                }
                if (this.layout[row][col-1]){ // if there is a col before this, take the height of the cell to the left
                    this.layout[row][col].pxDimensions.height = this.layout[row][col-1].pxDimensions.height;
                } else { // otherwise have a standard height
                    this.layout[row][col].pxDimensions.height = 1/dimensions.rows;
                }
            }
        }
    }
}

UserComponent.prototype.addComponent = function(component, row, col) {
    if (!this.components.hasOwnProperty(row)) {
        this.components[row]={};
    }
    this.components[row][col]=component;
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
    if (!object.layout){
        throw notCorrectObjectError;
    }

    return $.extend(new UserComponent(object.dimensions), object)
};

//selectedUserComponent = new UserComponent({rows: DEFAULT_ROWS, cols: DEFAULT_COLS}, DEFAULT_COMPONENT_NAME, 1, DEFAULT_VERSION, DEFAULT_AUTHOR);
//selectedUserComponent.addComponent({}, 2, 3);