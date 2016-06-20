/** ** ** ** Constants ** ** ** **/
var DEFAULT_ROWS = 3;
var DEFAULT_COLS = 3;
var DEFAULT_CELL_WIDTH = 250;
var DEFAULT_CELL_HEIGHT = 250;

var DEFAULT_COMPONENT_NAME = "New Component";
var DEFAULT_AUTHOR = "Unknown";
var DEFAULT_VERSION = '0.0.1';
/** ** ** ** ** ** ** ** ** ** **/



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

ClicheComponent.prototype.recalculateRatios = function(deltaRows, deltaCols){
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

ClicheComponent.prototype.addComponent = function(component, row, col) {
    if (!this.components.hasOwnProperty(row)) {
        this.components[row]={};
    }
    this.components[row][col]=component;
    return true;
};



selectedUserComponent = new ClicheComponent({rows: DEFAULT_ROWS, cols: DEFAULT_COLS}, DEFAULT_COMPONENT_NAME, 1, DEFAULT_VERSION, DEFAULT_AUTHOR);
//selectedUserComponent.addComponent({}, 2, 3);