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
                        hidden:{isHidden: false, hidingCellId: ''}
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
    this.layout = {}; // this is to remember this sizes of different cells

    for (var row = 1; row<=dimensions.rows; row++){
        this.layout[row] = {};
        for (var col = 1; col<= dimensions.cols; col++){
            this.layout[row][col] = {
                                        spans:{row:1,col:1},
                                        merged:{isMerged: false, lastMergedBottomRightCellId: ''},
                                        hidden:{isHidden: false, hidingCellId: ''}
                                    };
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