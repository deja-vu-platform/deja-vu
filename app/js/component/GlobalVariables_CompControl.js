/** ** ** ** Global Variables ** ** ** **/
const DEFAULT_GRID_WIDTH = 800;
const DEFAULT_GRID_HEIGHT = 550;
const DEFAULT_FONT_SIZE = 14; // px

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

var gridWidth = DEFAULT_GRID_WIDTH; // This is without the padding! This is the zoomed version of the width
var gridHeight = DEFAULT_GRID_HEIGHT; // This is without the padding! This is the zoomed version of the height

var currentZoom = 1.0;
var basicComponents;

// settings
var confirmOnDangerousMerge = true;
var confirmOnUserComponentDelete = true;
/** ** ** ** ** ** ** ** ** ** ** ** ** **/
