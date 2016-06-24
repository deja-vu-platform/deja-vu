/** ** ** ** Global Variables ** ** ** **/

var numRows = DEFAULT_ROWS;
var numCols = DEFAULT_COLS;
var cellWidth = DEFAULT_CELL_WIDTH;
var cellHeight = DEFAULT_CELL_HEIGHT;
var files = [];

var standardCellWidth = 267;
var standardCellHeight = 183;

var selectedUserComponent = null;
var selectedProject = null;

var bitmapOld = null;
var bitmapNew = null;

var gridWidth = 800;
var gridHeight = 550;

var currentZoom = 1.0;
var basicComponents;

// settings
var confirmOnDangerousMerge = true;
var confirmOnUserComponentDelete = true;
/** ** ** ** ** ** ** ** ** ** ** ** ** **/
