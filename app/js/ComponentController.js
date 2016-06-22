var numRows = DEFAULT_ROWS;
var numCols = DEFAULT_COLS;
var cellWidth = DEFAULT_CELL_WIDTH;
var cellHeight = DEFAULT_CELL_HEIGHT;
var files = [];

// currently save components in this array
var selectedUserComponent = null;
var selectedProject = null;

var bitmapOld = null;
var bitmapNew = null;

var gridWidth;
var gridHeight;

// Initialization
$(function () {
    Parse.initialize("8jPwCfzXBGpPR2WVW935pey0C66bWtjMLRZPIQc8", "zgB9cjo7JifswwYBTtSvU1MSJCMVZMwEZI3Etw4d");

    // TODO get project information from local storage
    // TODO load first component (or maybe the last edited one?)
    // TODO if no components, then load the default one

    selectedProject = window.sessionStorage.getItem('selectedProject');
    if (selectedProject){ // if it exists
        selectedProject = $.extend(new UserProject(), JSON.parse(selectedProject));
        for (var componentId in selectedProject.components){
            var component = selectedProject.components[componentId];
            selectedProject.components[componentId] = $.extend(new UserComponent(component.dimensions), component);
        }
    } else { // make a new one
        selectedProject = new UserProject(DEFAULT_PROJECT_NAME, 1, DEFAULT_VERSION, DEFAULT_AUTHOR);
    }

    $('.project-name .header').text(selectedProject.meta.name);

    if (selectedProject.numComponents === 0){
        // start a default component
        selectedUserComponent = initUserComponent(true);
        var grid = $('#table-container').get(0);
        gridWidth = grid.offsetWidth;
        gridHeight = grid.offsetHeight;
        createTable(gridWidth, gridHeight);
        addComponentToUserProjectAndDisplayInListAndSelect(selectedUserComponent);
    } else {
        var componentToLoadId = Object.keys(selectedProject.components)[0];
        selectedUserComponent = selectedProject.components[componentToLoadId];
        displayNewComponentInUserComponentListAndSelect(selectedUserComponent.meta.name, componentToLoadId);
        for (var componentId in selectedProject.components){
            if (componentId != componentToLoadId){
                var componentName = selectedProject.components[componentId].meta.name
                displayNewComponentInUserComponentList(componentName, componentId);
            }
        }
        loadTable(gridWidth, gridHeight, selectedUserComponent);

    }

});

$('#create-component').on('click', function () {
    numRows = $('#select-rows').val();
    numCols = $('#select-cols').val();
    selectedUserComponent = initUserComponent(false);
    addComponentToUserProjectAndDisplayInListAndSelect(selectedUserComponent);
    createTable(gridWidth, gridHeight, false);
    resetMenuOptions();
});

$('#load-component-btn').on('click', function () {
    selectedUserComponent = JSON.parse($('#component-json').val());
    loadTable(gridWidth, gridHeight, selectedUserComponent);
    addComponentToUserProjectAndDisplayInList(selectedUserComponent);
    resetMenuOptions();
});

function downloadObject(filename, obj) {
    var element = document.createElement('a');
    var data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));

    element.setAttribute('href', data);
    element.setAttribute('download', filename);

    element.click();
}


$('#save-component').on('click', function () {

    window.open("data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(selectedUserComponent, null, '\t')));
});


$('#save-project').on('click', function () {

    //window.open("data:text/json;charset=utf-8," +
    //    encodeURIComponent(JSON.stringify(selectedProject, null, '\t')));

    downloadObject(selectedProject.meta.name+'.json', selectedProject);
});

$('#back-to-projects').click(function(event){
    event.preventDefault();
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject)); // save the updated project
    window.location = 'projectView.html';
});

$('#user-components-list').on('click', 'li', function () {
    var componentId = $(this).data('componentid');
    $('#selected').removeAttr('id');
    $(this).attr('id', 'selected');
    selectedUserComponent = selectedProject.components[componentId];
    loadTable(gridWidth, gridHeight, selectedUserComponent);
});

$('#user-components-list').on('dblclick', '.component-name', function () {
    var newNameInputElt = $($(this).parent().find('.new-name-input'));
    var submitRenameElt = $($(this).parent().find('.submit-rename'));
    newNameInputElt.val($(this).text());
    submitRenameElt.removeClass('not-displayed');
    $(this).addClass('not-displayed');
    newNameInputElt.focus();
    newNameInputElt.select();
});

$('#user-components-list').on('keypress', '.new-name-input', function (event) {
    if (event.which == 13) {
        event.preventDefault();
        var componentNameElt = $($(this).parent().parent().find('.component-name'));
        var submitRenameElt = $($(this).parent().parent().find('.submit-rename'));

        componentNameElt.removeClass('not-displayed');
        submitRenameElt.addClass('not-displayed');
        var newName = $(this).val();
        if (newName.length === 0) { // empty string entered, don't change the name!
            return;
        }
        componentNameElt.text($(this).val());
        // update the display of the component box
        $('<style>.main-table::after{content:"' + $(this).val() + '"}</style>').appendTo('head');

        selectedUserComponent.meta.name = $(this).val();

        // was attempting to change the ids, but it doesn't seem to be a good idea
        //var oldId = selectedUserComponent.meta.id;
        //var newId = generateId(selectedUserComponent.meta.name);
        //selectedUserComponent.meta.id = newId;
        //selectedProject.componentIdSet[newId] = "";
        //delete selectedProject.componentIdSet[oldId];
        //selectedProject.components[newId] = selectedUserComponent;
        //delete selectedProject.components[oldId];
        //$(this).parent().parent().data('componentid', newId);
    }
});

/**
 * Resets the menu options to their default values
 */
function resetMenuOptions() {
    $('#select-rows').val(DEFAULT_ROWS);
    $('#select-cols').val(DEFAULT_COLS);
    $('#new-component-name').val('');
    $('#component-version').val('');
    $('#component-author').val('');

    $('#component-json').val('');
}

/**
 * Requires that the row, col in the datatype is already created
 * @param row
 * @param col
 * @returns {Element}
 */
function createTableCell(row, col) {
    var td = document.createElement('td');
    td.className = 'droppable cell col' + '_' + col;

    td.id = 'cell' + '_' + row + '_' + col;

    var sp = document.createElement('span');
    sp.innerHTML = '<button type="button" class="edit-btn btn btn-default btn-xs"><span class="glyphicon glyphicon-pencil"></span></button>';

    var button = sp.firstChild;
    button.id = 'edit-btn' + '_' + row + '_' + col;

    td.appendChild(button);


    $(button).on("click", function (e) {
        var rowcol = this.id.split('_');
        $('#cell' + '_' + rowcol[rowcol.length - 2] + '_' + rowcol[rowcol.length - 1]).find('.tooltip').addClass('open');
    });

    // change size of cell based on the layout
    var rowspan = selectedUserComponent.layout[row][col].spans.row;
    var colspan = selectedUserComponent.layout[row][col].spans.col;

    var isMerged = selectedUserComponent.layout[row][col].merged.isMerged;
    var lastMergedBottomRightCellId = selectedUserComponent.layout[row][col].merged.lastMergedBottomRightCellId;

    var isHidden = selectedUserComponent.layout[row][col].hidden.isHidden;
    var hidingCellIdId = selectedUserComponent.layout[row][col].hidden.hidingCellId;

    $(td).data('merged', {isMerged:isMerged, lastMergedBottomRightCellId: lastMergedBottomRightCellId});
    $(td).data('hidden', {isHidden:isHidden, lastMergedBottomRightCellId: hidingCellIdId});


    if (isHidden) {
        $(td).css("display", "none");
    } else {
        $(td).attr("rowSpan", rowspan);
        $(td).attr("colSpan", colspan);
    }

    return td;
}


function createGridCell(row, col) {
    var td = document.createElement('td');
    td.id = 'grid' + '_' + row + '_' + col;
    td.className = 'grid col' + '_' + col;
    return td;
}

function createEmptyRow(rowNumber) {
    var tr = document.createElement('tr');
    tr.className = 'row' + '_' + rowNumber;
    return tr;
}


/**
 * Generate the table
 */
function createTable(gridWidth, gridHeight) {
    /*
     Note about naming conventions:
     for naming id, try to follow this rule

     name-with-several-parts_idrownumber_idcolnumber

     */

    $('#table-container').html('');

    var tableGrid = document.createElement('table');
    tableGrid.className = 'main-table';
    tableGrid.id = 'main-cell-table';
    for (var row = 1; row <= numRows; row++) {
        var tr = createEmptyRow(row);
        for (var col = 1; col <= numCols; col++) {
            var td = createTableCell(row, col);
            tr.appendChild(td);
        }
        tableGrid.appendChild(tr);

    }

    document.getElementById('table-container').appendChild(tableGrid);

    createGuideGrid();
    initialResizeCells(numRows, numCols);

    attachMergeHandlers();
    registerDroppable();
    addRowColAddRemoveButtons();

    addRowColResizeHandlers();
    //addTableResizeHandler();

    bitmapOld = make2dArray(numRows, numCols);
    bitmapNew = make2dArray(numRows, numCols);

}

function resetMergeHandleContainersSizeAndPostition(){
    for (var row = 1; row <= numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            var cell = $("#cell" + '_' + row + '_' + col);

            var offset = cell.offset();
            var width = cell.css("width");
            var height = cell.css("height");

            var dragHandleContainer = $('#drag-handle-container' + '_' + row + '_' + col);

            dragHandleContainer.css({
                position: 'absolute',
                top: offset.top,
                left: offset.left,
                width: width,
                height: height,
            });
        }
    }
}

function attachMergeHandlers() {
    $('#drag-handle-containers-container').html('');
    for (var row = 1; row <= numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            var td = $("#cell" + '_' + row + '_' + col);

            var offset = td.offset();
            var width = td.css("width");
            var height = td.css("height");

            var dragHandleContainer = document.createElement('div');
            dragHandleContainer.id = 'drag-handle-container' + '_' + row + '_' + col;
            dragHandleContainer.className = 'row_'+ row + ' col_' + col;
            var dragHandle = document.createElement('span');

            dragHandle.innerHTML = '<img src="images/drag_handle_icon.png" width="15px" height="15px">';
            dragHandle.className = 'ui-resizable-handle ui-resizable-se drag-handle';
            dragHandle.id = 'drag-handle' + '_' + row + '_' + col;

            dragHandleContainer.appendChild(dragHandle);
            $('#drag-handle-containers-container').append(dragHandleContainer);
            $(dragHandleContainer).css({
                position: 'absolute',
                top: offset.top,
                left: offset.left,
                width: width,
                height: height,
                'pointer-events': 'none',
            });

            $(dragHandle).mouseenter(function (event, ui) {
                $(this).parent().css({
                    border: 'black 1px dotted'
                });
            });

            $(dragHandle).mouseleave(function (event, ui) {
                $(this).parent().css({
                    border: 'none'
                });
            });

            $(dragHandle).css({
                'pointer-events': 'auto',
                position: 'absolute',
                bottom: '5px',
                right: '5px',
                cursor: 'nwse-resize',
            });

            $(dragHandleContainer).resizable({
                handles: {
                    'se': '#drag-handle' + '_' + row + '_' + col
                },
                start: function (event, ui) {
                    $('#guide-grid-container td').css({
                        border: 'black 1px dotted',
                        visibility: 'visible'
                    });
                    $('.drag-handle').off('mouseenter mouseleave');
                    $(event.target).css({
                        border: 'black 1px dotted'
                    });
                },
                stop: function (event, ui) {
                    var dragHandleContainer = $(this);
                    var containerId = dragHandleContainer.get(0).id;
                    var rowcol = containerId.split('_');
                    var row = rowcol[rowcol.length - 2];
                    var col = rowcol[rowcol.length - 1];

                    var component;
                    if (selectedUserComponent.components[row]) {
                        if (selectedUserComponent.components[row][col]) {
                            component = selectedUserComponent.components[row][col];
                        }
                    }

                    // Now we look for the cell to merge into
                    // In case the cell we are resizing was already merged (ie, we are making it smaller,
                    // then the cell we want to merge will not be visible. So we need to use the grid.
                    // For that, we first make the grid visible and able to take mouse events
                    $('#guide-grid-container td').css({
                        'z-index': 100,
                        visibility: 'visible',
                        'pointer-events': 'visiblePainted',
                    });

                    // Then we look for the grid element underneath the mouse (this requires the element to be visible
                    // and able to accept mouse events).
                    // useful page http://stackoverflow.com/questions/6073505/what-is-the-difference-between-screenx-y-clientx-y-and-pagex-y
                    // frame of reference fro clientX/Y does not change even if you scroll
                    var allEltsList = allElementsFromPoint(event.clientX, event.clientY);
                    // other interesting functions
                    // document.elementFromPoint(event.pageX, event.pageY)
                    // document.querySelectorAll(':hover');

                    // then we reset these values
                    $('#guide-grid-container td').css({
                        'z-index': 0,
                        visibility: 'hidden',
                        'pointer-events': 'none',
                    });

                    var newCellGrid = $(allEltsList).filter('.grid');
                    if (!newCellGrid[0]) { // it's outside the table
                        mergeCells('cell' + '_' + row + '_' + col, 'cell' + '_' + row + '_' + col, component);
                    } else {
                        var newCellGridRowcol = newCellGrid[0].id.split('_');
                        var newCellId = 'cell' + '_' + newCellGridRowcol[newCellGridRowcol.length - 2] + '_' + newCellGridRowcol[newCellGridRowcol.length - 1];
                        mergeCells('cell' + '_' + row + '_' + col, newCellId, component);
                    }

                    // rest event handlers
                    $('#guide-grid-container td').css({
                        border: 'none',
                    });
                    $('.drag-handle').mouseenter(function (event, ui) {
                        $(this).parent().css({
                            border: 'black 1px dotted'
                        });
                    });

                    $('.drag-handle').mouseleave(function (event, ui) {
                        $(this).parent().css({
                            border: 'none'
                        });
                    });
                    $('.drag-handle').parent().css({
                        border: 'none'
                    });
                }
            });

            var rowspan = selectedUserComponent.layout[row][col].spans.row;
            var colspan = selectedUserComponent.layout[row][col].spans.col;

            if (rowspan === 0) { // and thus also colspan
                $(dragHandleContainer).css("display", "none");
            }
        }
    }

}

// from http://stackoverflow.com/questions/8813051/determine-which-element-the-mouse-pointer-is-on-top-of-in-javascript
function allElementsFromPoint(x, y) {
    var element, elements = [];
    var oldVisibility = [];
    while (true) {
        element = document.elementFromPoint(x, y);
        if (!element || element === document.documentElement) {
            break;
        }
        elements.push(element);
        oldVisibility.push(element.style.visibility);
        element.style.visibility = 'hidden'; // Temporarily hide the element (without changing the layout)
    }
    for (var k = 0; k < elements.length; k++) {
        elements[k].style.visibility = oldVisibility[k];
    }
    elements.reverse();
    return elements;
}

function createGuideGrid() {
    $('#guide-grid-container').html('');

    var grid = document.createElement('table');
    grid.className = 'main-table';
    grid.id = 'main-grid-table';
    for (var row = 1; row <= numRows; row++) {
        var tr = createEmptyRow(row);

        for (var col = 1; col <= numCols; col++) {
            var td = createGridCell(row, col);
            tr.appendChild(td);
        }
        grid.appendChild(tr);
    }

    document.getElementById('guide-grid-container').appendChild(grid);

}

function addRowColResizeHandlers(){
    // Have a resizable on the rows
    // once resize is stopped, loop through all the rows/cols, and store the
    // col-width/table-width or col-height/table-height or something similar
    //
    //  Then also set the cell size in load table (or resize function) based on these values

    // glyphicon-resize-horizontal
    // glyphicon-resize-vertical

    for (var row = 1; row <= numRows; row++) {
        $('#table-container .row_' + row).resizable({
            //handles: {
            //    'se': resizeHandleRow,
            //},
            handles: 's',
            alsoResize: '#table-container .row_' + row + ' .cell, ' +  // also resize the td's
                            '#guide-grid-container .row_' + row + ' .grid,' + // also resize the td's
                            ' #guide-grid-container .row_' + row + ', ' +
                            '#drag-handle-containers-container .row_' + row + ', ' +
                            //'#table-container .row_' + row + ' .ui-resizable-s' +
                            ' .ui-resizable-s-row_'+row,
            resize: function () {
                // TODO get rid of this later!
                resetMergeHandleContainersSizeAndPostition();
                //var resizablesList = $('.ui-resizable-s');
                //for (var i = 0; i<resizablesList.length; i++){
                //    $(resizablesList.get(i)).css({
                //        'padding-top': (parseFloat($(resizablesList.get(i)).parent().css('height')) - 25).toString() + 'px',
                //    });
                //}

            },
            stop: function () {
                resetMergeHandleContainersSizeAndPostition();
                saveRowColRatios();
            }
        });

        $('#table-container .row_' + row).css({
            position: 'relative',
            width: $('#table-container .row_' + row).css('width'),
            height: $('#table-container .row_' + row).css('height')
        })

        var handle = document.createElement('div');
        $(handle).addClass('glyphicon glyphicon-resize-vertical ');

        $('#table-container .row_' + row + ' .ui-resizable-s').addClass('ui-resizable-s-row_'+row).append(handle).css({
            cursor: 'ns-resize',
            width: 0,
            height: $('#table-container .row_' + row).css('height'),
            position: 'relative',

        });

        $(handle).css({
            position: 'absolute',
            top: 'auto',
            bottom: '10px',
            width: 0,
            height: 0
        })


    }

    for (var col = 1; col <= numCols; col++) {
        $('#table-container #cell_1_' + col).resizable({ //there is always at least 1 cell!
            handles: 'ew',
            alsoResize: '#table-container .col_' + col + ',' + // the td's are already resized!
                        '#guide-grid-container .col_' + col + ', ' +
                        '#drag-handle-containers-container .col_' + col,
            resize: function () {
                // TODO: move to stop() once the cell resize handles are made invisible
                resetMergeHandleContainersSizeAndPostition();
            },
            stop: function () {
                resetMergeHandleContainersSizeAndPostition();
                saveRowColRatios();
            }
        });

        $('#table-container .col_' + col + ' .ui-resizable-ew').addClass('glyphicon glyphicon-resize-horizontal').css({
            cursor: 'ew-resize',
            position: 'absolute',
            top: '-15px',
            left: 'auto',
            right: '5px',
            width: 0,
            height: 0

        });


    }
}

function addTableResizeHandler(){
    var dragHandle = document.createElement('span');

    dragHandle.innerHTML = '<img src="images/drag_handle_icon.png" width="15px" height="15px">';
    dragHandle.className = 'ui-resizable-handle ui-resizable-se';
    dragHandle.id = 'table-drag-handle';


    $('#main-cell-table').append(dragHandle).resizable({
        handles: {
            'se': '#table-drag-handle'
        },
        alsoResize: '#main-grid-table',
        resize: function () {
            // TODO get rid of this later!
            resetMergeHandleContainersSizeAndPostition();
        },
        stop: function () {
            resetMergeHandleContainersSizeAndPostition();
            saveRowColRatios();
        }
    });

    $('#table-drag-handle').css({
        cursor: 'nwse-resize',
        width: 0,
        height: 0,
        position: 'absolute',
        top: 'auto',
        bottom: 0,
        left: 'auto',
        right: 0
    });

}


function addRowColAddRemoveButtons(){
    var spAddRow = document.createElement('span');
    spAddRow.innerHTML = '<button type="button" class="btn btn-default ">' +
                    '<span class="glyphicon glyphicon-plus"></span>' +
                    '</button>';

    var buttonAddRow = spAddRow.firstChild;
    buttonAddRow.id = 'btn-add-row';

    $(buttonAddRow).on("click", function (e) {
        addRowToEnd();
    });

    var spRemoveRow = document.createElement('span');
    spRemoveRow.innerHTML = '<button type="button" class="btn btn-default ">' +
        '<span class="glyphicon glyphicon-minus"></span>' +
        '</button>';

    var buttonRemoveRow = spRemoveRow.firstChild;
    buttonRemoveRow.id = 'btn-remove-row';

    $(buttonRemoveRow).on("click", function (e) {
        removeEndRow();
    });


    var spAddCol = document.createElement('span');
    spAddCol.innerHTML = '<button type="button" class="btn btn-default ">' +
        '<span class="glyphicon glyphicon-plus"></span>' +
        '</button>';

    var buttonAddCol = spAddCol.firstChild;
    buttonAddCol.id = 'btn-add-col';

    $(buttonAddCol).on("click", function (e) {
        addColToEnd();
    });

    var spRemoveCol = document.createElement('span');
    spRemoveCol.innerHTML = '<button type="button" class="btn btn-default ">' +
        '<span class="glyphicon glyphicon-minus"></span>' +
        '</button>';

    var buttonRemoveCol = spRemoveCol.firstChild;
    buttonRemoveCol.id = 'btn-remove-col';

    $(buttonRemoveCol).on("click", function (e) {
        removeEndCol();
    });

    $('#main-cell-table').append(buttonAddRow).append(buttonRemoveRow).append(buttonAddCol).append(buttonRemoveCol);
}

function saveRowColRatios(){
    // save the new table dimensions
    //selectedUserComponent.layout.tablePxDimensions.width = $('#main-cell-table').css('width');
    //selectedUserComponent.layout.tablePxDimensions.height = $('#main-cell-table').css('height');

    for (var row = 1; row<=numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            var cell = $('#grid' + '_' + row + '_' + col); //grid is better to use?, since cells can merge with other cells
            var cellWidth = parseFloat(cell.css('width'));
            var cellHeight = parseFloat(cell.css('height'));
            var widthRatio = cellWidth/(gridWidth-20);
            var heightRatio = cellHeight/(gridHeight-20);

            selectedUserComponent.layout[row][col].pxDimensions.width = widthRatio;
            selectedUserComponent.layout[row][col].pxDimensions.height = heightRatio;
        }
    }

}



/**
 * Creates and displays a table based on the component given
 * @param componentToShow
 */
function loadTable(gridWidth, gridHeight, componentToShow) {
    $('<style>.main-table::after{content:"' + componentToShow.meta.name + '"}</style>').appendTo('head');
    numRows = componentToShow.dimensions.rows;
    numCols = componentToShow.dimensions.cols;
    createTable(gridWidth, gridHeight);

    $('#table-container td').each(function () {
        var cellId = $(this).get(0).id;
        var rowcol = cellId.split('_');
        var row = rowcol[rowcol.length - 2];
        var col = rowcol[rowcol.length - 1];
        if (componentToShow.components[row]) {
            if (componentToShow.components[row][col]) {
                var innerComponent = componentToShow.components[row][col];
                var type = innerComponent.type;
                showConfigOptions(type, document.getElementById(cellId));

                Display(cellId, getHTML[type](innerComponent.components[type]));
                $($('.draggable[name=' + type + ']').get(0)).clone().appendTo($('#' + cellId).get(0));
                triggerEdit(cellId, false);

                $('#' + cellId).addClass("dropped");
                $('#' + cellId).removeClass("droppable");
                $('#' + cellId).droppable('disable');

            }
        }
    });


    updateBitmap();
    registerDraggable();
    registerTooltipBtnHandlers();
}

/**
 * Resize cell such that all cells fill width and height of grid
 * @param numRows
 * @param numCols
 */
function initialResizeCells(numRows, numCols) {
    // TODO use saved ratios from the datatype
    if (!selectedUserComponent.layout.tablePxDimensions.isSet){
        selectedUserComponent.layout.tablePxDimensions.width = gridWidth;
        selectedUserComponent.layout.tablePxDimensions.height = gridHeight;
        selectedUserComponent.layout.tablePxDimensions.isSet = true;
    } else {
        gridWidth = selectedUserComponent.layout.tablePxDimensions.width;
        gridHeight = selectedUserComponent.layout.tablePxDimensions.height;
        $('#table-container').css({
            width: gridWidth,
            height: gridHeight
        })
    }

    cellWidth = ((gridWidth-20) / numCols);
    cellHeight = ((gridHeight-20) / numRows);

    //console.log(cellWidth);
    //console.log(cellHeight);

    for (var row = 1; row<=numRows; row++){
        for (var col = 1; col<=numCols; col++){
            var widthRatio = selectedUserComponent.layout[row][col].pxDimensions.width;
            var heightRatio = selectedUserComponent.layout[row][col].pxDimensions.height;
            var thisCellWidth = widthRatio*(gridWidth-20);
            var thisCellHeight = heightRatio*(gridHeight-20);
            var tooltipWidth = Number($('.tooltip').css('width').substring(0, 3));
            $('#cell' + '_' + row + '_' + col).css({
                width: thisCellWidth + 'px',
                height: thisCellHeight + 'px',
            })
            $('#grid' + '_' + row + '_' + col).css({
                width: thisCellWidth + 'px',
                height: thisCellHeight + 'px',
            })
        }
    }

    //getCSSRule('td').style.setProperty('width', cellWidth + 'px', null);
    //getCSSRule('td').style.setProperty('height', cellHeight + 'px', null);
    getCSSRule('.tooltip').style.setProperty('left', -1 * Math.floor((tooltipWidth - (cellWidth - 40)) / 2) + 'px', null);

    resizeLabelDivs(cellWidth, cellHeight);

}

function addComponentToUserProjectAndDisplayInListAndSelect(newComponent){
    $('#selected').removeAttr("id");
    addComponentToUserProjectAndDisplayInList(newComponent);
    $("#user-components-list").find("[data-componentid='" + newComponent.meta.id + "']").attr('id', 'selected');
}



/**
 * Adds a component to the list of user components
 * @param newComponent
 */
function addComponentToUserProjectAndDisplayInList(newComponent) {
    selectedProject.addComponent(newComponent.meta.id, newComponent);
    displayNewComponentInUserComponentList(newComponent.meta.name, newComponent.meta.id);
};


function displayNewComponentInUserComponentListAndSelect(name, id){
    $('#selected').removeAttr("id");
    displayNewComponentInUserComponentList(name, id);
    $("#user-components-list").find("[data-componentid='" + id + "']").attr('id', 'selected');
}

function displayNewComponentInUserComponentList(name, id){
    var newComponentElt = '<li data-componentid=' + id + '>'
        + '<span class="component-name">' + name + '</span>'
        + '<span class="submit-rename not-displayed">'
        + '<input type="text" class="new-name-input form-control" autofocus>'
        + '</span>'
        + '</li>';
    $('#user-components-list').append(newComponentElt)
}

/**
 * Creates a new User component based on user inputs
 * @param isDefault
 * @constructor
 */
function initUserComponent(isDefault) {
    var name, version, author;
    if (isDefault) {
        name = DEFAULT_COMPONENT_NAME;
        version = DEFAULT_VERSION;
        author = DEFAULT_AUTHOR;
    } else {
        name = $('#new-component-name').val();
        version = $('#component-version').val();
        author = $('#component-author').val();
    }
    $('<style>.main-table::after{content:"' + name + '"}</style>').appendTo('head');
    var id = generateId(name);
    while (id in selectedProject.componentIdSet){ // very unlikely to have a collision unless the user has 1 Million components!
        id = generateId(name);
    }
    selectedProject.componentIdSet[id] = '';

    var newComponent = new UserComponent({rows: numRows, cols: numCols}, name, id, version, author);
    return newComponent;
}

/**
 * Adds a component to the table and displays it. If no component is given, it creates a
 * base component based on the widget
 *
 * Either a widget or a component has to be present
 *
 * @param widget
 * @param cellId
 * @param component
 */
function addComponent(cellId, widget, component) {
    var type;
    var rowcol = cellId.split('_');
    var row = rowcol[rowcol.length - 2];
    var col = rowcol[rowcol.length - 1];

    if (!component) {
        var span = document.createElement('span');
        span.innerHTML = widget[0].outerHTML;
        type = span.firstElementChild.getAttribute('name');
        component = new BaseComponent(type, {});

        showConfigOptions(type, document.getElementById(cellId));

        if (type === 'label') {
            Display(cellId, getHTML[type]("Type text here..."));
        } else if (type === 'panel') {
            Display(cellId, getHTML[type]({heading: "Type heading...", content: "Type content..."}));
        } else {
            Display(cellId, getHTML[type]());
            triggerEdit(cellId, true); // since this is a new component, show edit options
        }

    } else {// a component is there
        type = component.type;

        showConfigOptions(type, document.getElementById(cellId));

        Display(cellId, getHTML[type](component.components[type]));
        if (!widget) {
            $($('.draggable[name=' + type + ']').get(0)).clone().appendTo($('#' + cellId).get(0))
        }
        triggerEdit(cellId, false); // no need to show edit options

    }

    $('#' + cellId).addClass("dropped");
    $('#' + cellId).removeClass("droppable");
    $('#' + cellId).droppable('disable');
    registerDraggable();

    if (!selectedUserComponent.components.hasOwnProperty(row)) {
        selectedUserComponent.components[row] = {};
    }
    selectedUserComponent.components[row][col] = component;

    updateBitmap();
    registerTooltipBtnHandlers()
}


/**
 * Deletes a component from the datatype and also from the view
 */
function deleteComponent(cellId) {
    var rowcol = cellId.split('_');
    var row = rowcol[rowcol.length - 2];
    var col = rowcol[rowcol.length - 1];

    if (selectedUserComponent.components[row]) {
        if (selectedUserComponent.components[row][col]) {

            delete selectedUserComponent.components[row][col];
            var cell = $('#cell' + '_' + row + '_' + col).get(0);

            $(cell).find('.config-btns').remove();
            $(cell).find('.tooltip').remove();
            $(cell).find('.label-container').remove();
            $(cell).find('.display-component').remove();
            $(cell).find('.widget').remove();

            resetDroppability(cellId);
            updateBitmap();

        }
    }

}


function updateComponentAt(cellId) {
    var rowcol = cellId.split('_');
    var row = rowcol[rowcol.length - 2];
    var col = rowcol[rowcol.length - 1];
    var type = $('#' + cellId).get(0).getElementsByClassName('draggable')[0].getAttribute('name');
    var value;
    var isUpload = false;
    var inputs = Array.prototype.slice.call(
        $('#' + cellId).get(0).getElementsByTagName('input'), 0);

    if (type === 'label') {
        value = $('#' + cellId).find('p')[0].textContent;
    } else if (type === 'link') {
        value = {
            link_text: inputs[0].value,
            target: inputs[1].value
        }
    } else if (type === 'tab_viewer') {
        value = {
            "tab1": {text: inputs[0].value, target: inputs[1].value},
            "tab2": {text: inputs[2].value, target: inputs[3].value},
            "tab3": {text: inputs[4].value, target: inputs[5].value}
        }
    } else if (type === 'menu') {
        value = {
            "menu_item1": {text: inputs[0].value, target: inputs[1].value},
            "menu_item2": {text: inputs[2].value, target: inputs[3].value},
            "menu_item3": {text: inputs[4].value, target: inputs[5].value}
        }
    } else if (type === 'image') {
        value = {};

        if (files.length > 0) { // if there's a file to upload

            var file = files[0];
            var parseFile = new Parse.File(file.name, file);
            isUpload = true;
            files.length = 0; // clear the old file
            parseFile.save()
                .then(function (savedFile) { // save was successful
                    RemoveDisplay(cellId);
                    value.img_src = savedFile.url();
                    Display(cellId, getHTML[type](value));
                    selectedUserComponent.components[row][col].components[type] = value;
                });
        } else { // pasted link to image
            value.img_src = inputs[0].value;
        } // TODO what if empty link given?
    } else if (type === 'panel') {
        value = {
            heading: $('#' + cellId).find('.panel-title')[0].textContent,
            content: $('#' + cellId).find('.panel-body')[0].textContent
        }
    }

    if (!isUpload) {
        $('#' + cellId).find('.label-container').remove();
        $('#' + cellId).find('.display-component').remove();
        Display(cellId, getHTML[type](value), function () {
        });
        selectedUserComponent.components[row][col].components = {};
        selectedUserComponent.components[row][col].components[type] = value;
    }
}


/*
 BITMAP TO HELP IN UPDATE
 */
function quicklyMakeArray(size, func) {
    return Array.apply(null, Array(size)).map(func);
}
function make2dArray(rows, cols) {
    rows = Number(rows);
    cols = Number(cols);
    return quicklyMakeArray(rows, function () {
        return quicklyMakeArray(cols, function (i) {
            return 0;
        });
    });
}
function findDeletedCoord() {
    var result = [];
    for (var row = 0; row < numRows; row++) {
        for (var col = 0; col < numCols; col++) {
            if ((bitmapNew[row][col] - bitmapOld[row][col]) < 0) {
                result[0] = row + 1;
                result[1] = col + 1;
            } else if ((bitmapNew[row][col] - bitmapOld[row][col]) > 0) {
                result[2] = row + 1;
                result[3] = col + 1;
            }
        }
    }
    return result;
}

function updateBitmap() {
    bitmapOld = JSON.parse(JSON.stringify(bitmapNew));
    $('#table-container td').each(function () {
        var cellId = $(this).attr('id');
        var rowcol = cellId.split('_');
        var row = Number(rowcol[rowcol.length - 2]) - 1;
        var col = Number(rowcol[rowcol.length - 1]) - 1;
        if ($(this).get(0).getElementsByClassName('draggable').length == 0) {
            bitmapNew[row][col] = 0;
        } else {
            bitmapNew[row][col] = 1;
        }
    });
}


/*
 IMAGE UPLOAD HELPERS
 */
// file drag hover
function FileDragHover(e) {
    e.stopPropagation();
    e.preventDefault();
    if (e.type == "dragover") {
        $(e.target).addClass("hover");
    } else if (e.type == "dragleave") {
        $(e.target).removeClass("hover");
    }
}
// file selection
function FileSelectHandler(e) {

    FileDragHover(e); // cancel event and hover styling

    files = e.target.files || e.dataTransfer.files;

    $(e.target).text("Got file: " + truncate(files[0].name, 30));
}

function truncate(str, len) {
    return str.substring(0, len) + (str.length > len ? "... " + str.substring(str.length - 4) : "");
}

function getCSSRule(search) {
    var x = [].slice.call(document.styleSheets[2].cssRules);
    return x.filter(function (rule) {
        return rule.selectorText === search;
    })[0];
}

function resizeLabelDivs(cellWidth, cellHeight) {
    getCSSRule('.label-container').style.setProperty('width', (cellWidth - 10) + 'px', null);
    getCSSRule('.label-container').style.setProperty('height', (cellHeight - 30) + 'px', null);
    getCSSRule('.label-container').style.setProperty('padding-top', (cellHeight / 4) + 'px', null);
}


/*
 * Merging and unmerging cells
 */
function mergeCells(cell1Id, cell2Id, component) {
    // first check for top left cell and bottom right cell
    var rowcol1 = cell1Id.split('_');
    var row1 = rowcol1[rowcol1.length - 2];
    var col1 = rowcol1[rowcol1.length - 1];

    var rowcol2 = cell2Id.split('_');
    var row2 = rowcol2[rowcol2.length - 2];
    var col2 = rowcol2[rowcol2.length - 1];


    var topRowNum = Math.min(parseInt(row1), parseInt(row2));
    var bottomRowNum = Math.max(parseInt(row1), parseInt(row2));

    var leftColNum = Math.min(parseInt(col1), parseInt(col2));
    var rightColNum = Math.max(parseInt(col1), parseInt(col2));

    var topLeftCellId = "cell" + '_' + topRowNum.toString() + '_' + leftColNum.toString();
    var bottomRightCellId = "cell" + '_' + bottomRowNum.toString() + '_' + rightColNum.toString();

    // figure out if this is already a merged cell
    var merged = $('#' + topLeftCellId).data('merged');
    if (merged.isMerged) {
        // if merged, unmerge the two cells
        // this also resets the cells to unmerged status
        unmergeCells(topLeftCellId);
    }

    if (topLeftCellId != bottomRightCellId) { // not merging/unmerging to the same cell,
        // that is, the cell is actually merging to something else
        // mark cell as merged
        $('#' + topLeftCellId).data('merged', {isMerged: true, lastMergedBottomRightCellId: bottomRightCellId});
        for (var row = topRowNum; row <= bottomRowNum; row++) {
            for (var col = leftColNum; col <= rightColNum; col++) {
                var cellId = "cell" + '_' + row.toString() + '_' + col.toString();

                // delete any component that was there
                // TODO: note: checks should be made before calling this function!
                deleteComponent(cellId);

                if ((row == topRowNum) && (col == leftColNum)) { // the cell we just made bigger
                    continue;
                }


                // if it is a hidden cell, unmerge the hiding cell
                var hidden = $('#' + cellId).data('hidden');
                var merged = $('#' + cellId).data('merged');
                if (hidden.isHidden){
                    unmergeCells(hidden.hidingCellId);
                }

                // figure out if this is already a merged cell
                if (merged.isMerged) {
                    // if merged, unmerge the two cells
                    // this also resets the cells to unmerged status
                    unmergeCells(cellId);
                }


                // then hide the other cells
                var cellToHide = $("#" + cellId);
                cellToHide.css("display", "none");
                cellToHide.data('hidden', {isHidden: true, hidingCellId: topLeftCellId});

                var dragContainerToHide = $('#drag-handle-container' + '_' + row + '_' + col);
                dragContainerToHide.css('display', 'none');

                selectedUserComponent.layout[row][col].spans = {row:0,col:0};
                selectedUserComponent.layout[row][col].merged = {isMerged: false, lastMergedBottomRightCellId: ''};
                selectedUserComponent.layout[row][col].hidden = {isHidden: true, hidingCellId: topLeftCellId};
            }
        }

    }

    // Make the first cell take the correct size
    var cellTopLeft = $("#" + topLeftCellId);
    var rowspan = bottomRowNum - topRowNum + 1;
    var colspan = rightColNum - leftColNum + 1;
    cellTopLeft.attr("rowSpan", rowspan);
    cellTopLeft.attr("colSpan", colspan);
    $('#drag-handle-container' + '_' + topRowNum + '_' + leftColNum).css({
        width: cellTopLeft.css('width'),
        height: cellTopLeft.css('height'),
    });

    // update the datatype
    selectedUserComponent.layout[topRowNum][leftColNum].spans = {row:rowspan,col:colspan};
    selectedUserComponent.layout[topRowNum][leftColNum].merged = {isMerged: true, lastMergedBottomRightCellId: bottomRightCellId};
    selectedUserComponent.layout[topRowNum][leftColNum].hidden = {isHidden: false, hidingCellId: ''};


    // then put the component in there
    if (component) {
        // add the component to the cell
        addComponent(topLeftCellId, false, component);
    }

    // TODO this is doing some redundant stuff, maybe reduce some stuff above?
    resetMergeHandleContainersSizeAndPostition();

}

function unmergeCells(cellToUnmergeId, component) {
    var cellToUnmergeRowcol = cellToUnmergeId.split('_');
    var cellToUnmergeRow = cellToUnmergeRowcol[cellToUnmergeRowcol.length - 2];
    var cellToUnmergeCol = cellToUnmergeRowcol[cellToUnmergeRowcol.length - 1];


    var lastMergedCellBottomRightId = $('#' + cellToUnmergeId).data('merged').lastMergedBottomRightCellId;


    var lastMergedCellBottomRightRowcol = lastMergedCellBottomRightId.split('_');
    var lastMergedCellBottomRightRow = lastMergedCellBottomRightRowcol[lastMergedCellBottomRightRowcol.length - 2];
    var lastMergedCellBottomRightCol = lastMergedCellBottomRightRowcol[lastMergedCellBottomRightRowcol.length - 1];


    var topRowNum = Math.min(parseInt(cellToUnmergeRow), parseInt(lastMergedCellBottomRightRow));
    var bottomRowNum = Math.max(parseInt(cellToUnmergeRow), parseInt(lastMergedCellBottomRightRow));

    var leftColNum = Math.min(parseInt(cellToUnmergeCol), parseInt(lastMergedCellBottomRightCol));
    var rightColNum = Math.max(parseInt(cellToUnmergeCol), parseInt(lastMergedCellBottomRightCol));


    // Make the first cell take the correct size
    var topLeftCellId = "cell" + '_' + topRowNum.toString() + '_' + leftColNum.toString();

    var cellTopLeft = $("#" + topLeftCellId);
    cellTopLeft.attr("rowSpan", 1);
    cellTopLeft.attr("colSpan", 1);
    // display all the other cells in that block
    for (var row = topRowNum; row <= bottomRowNum; row++) {
        for (var col = leftColNum; col <= rightColNum; col++) {
            var cellId = "cell" + '_' + row.toString() + '_' + col.toString();
            var gridId = 'grid' + '_' + row.toString() + '_' + col.toString();
            // update the datatype
            selectedUserComponent.layout[row][col].spans = {row:1,col:1};
            selectedUserComponent.layout[row][col].merged = {isMerged: false, lastMergedBottomRightCellId: ''};
            selectedUserComponent.layout[row][col].hidden = {isHidden: false, hidingCellId: ''};


            var cellToShow = $("#" + cellId);
            cellToShow.css("display", "table-cell");

            // reset some meta data
            cellToShow.data('merged', {isMerged: false, lastMergedBottomRightCellId: ''});
            cellToShow.data('hidden', {isHidden: false, hidingCellId: ''});


            // return rowspan/colspan to 1
            cellToShow.attr("rowSpan", 1);
            cellToShow.attr("colSpan", 1);

            // delete any component that was there
            deleteComponent(cellId);

            var dragContainerToShow = $('#drag-handle-container' + '_' + row + '_' + col);
            var cellOffset = $('#' + gridId).offset();
            dragContainerToShow.css({
                display: 'block',
                top: cellOffset.top,
                left: cellOffset.left,
                width: cellToShow.css('width'),
                height: cellToShow.css('height'),
            });

        }
    }

    if (component) {
        // add the component to the cell
        addComponent(topLeftCellId, false, component);
    }

    // TODO this is doing some redundant stuff, maybe reduce some stuff above?
    resetMergeHandleContainersSizeAndPostition();
}


/*
 Adding and deleting rows and columns
 */

/**
 * Adds a row to the end
 * Mutates selectedUserComponent
 */
function addRowToEnd() {

    // old solution trying to addrow without loading the entire table,
    // needed more work...
    //var lastRowNum = selectedUserComponent.dimensions.rows;
    //
    //// datatype update
    //selectedUserComponent.dimensions.rows += 1;
    //numRows += 1;
    //selectedUserComponent.layout[lastRowNum + 1] = {}
    //
    //// visual update
    //var tableRow = createEmptyRow(lastRowNum + 1);
    //var gridRow = createEmptyRow(lastRowNum + 1);
    //
    //for (var i = 1; i <= selectedUserComponent.dimensions.cols; i++) {
    //    selectedUserComponent.layout[lastRowNum + 1][i] = [1, 1, false, ''];
    //    var tableCell = createTableCell(lastRowNum + 1, i);
    //    tableRow.appendChild(tableCell);
    //    var gridCell = createGridCell(lastRowNum + 1, i);
    //    gridRow.appendChild(gridCell);
    //}
    //
    //$('#table-container table').append(tableRow);
    //$('#guide-grid-container table').append(gridRow);
    //
    //attachMergeHandlers();
    //bitmapNew = make2dArray(numRows, numCols);
    //updateBitmap();
    //// from http://stackoverflow.com/questions/597588/how-do-you-clone-an-array-of-objects-in-javascript
    //bitmapOld = JSON.parse(JSON.stringify(bitmapNew)); // as not to have issues with the old and the new having
    //// different numbers of rows

    var lastRowNum = parseInt(selectedUserComponent.dimensions.rows);

    selectedUserComponent.dimensions.rows = lastRowNum + 1;
    numRows += 1;
    selectedUserComponent.layout[lastRowNum + 1] = {}

    for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++) {
        selectedUserComponent.layout[lastRowNum + 1][col] = {
                                                                spans:{row:1,col:1},
                                                                merged:{isMerged: false, lastMergedBottomRightCellId: ''},
                                                                hidden:{isHidden: false, hidingCellId: ''}
                                                            }
    }
    selectedUserComponent.recalculateRatios(1,0);
    loadTable(gridWidth, gridHeight, selectedUserComponent);


}

/**
 * Removes the end row
 * Does nothing if there is only one row left
 * Mutates selectedUserComponent
 */
function removeEndRow() {
    var lastRowNum = parseInt(selectedUserComponent.dimensions.rows);

    if (lastRowNum == 1){
        return
    }

    selectedUserComponent.dimensions.rows = lastRowNum - 1;
    numRows -= 1;
    delete selectedUserComponent.layout[lastRowNum];

    selectedUserComponent.recalculateRatios(-1,0);
    loadTable(gridWidth, gridHeight, selectedUserComponent);

}

/**
 * Adds a column to the end
 * Mutates selectedUserComponent
 */
function addColToEnd() {
    var lastColNum = parseInt(selectedUserComponent.dimensions.cols);

    selectedUserComponent.dimensions.cols = lastColNum + 1;
    numCols += 1;

    for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
        selectedUserComponent.layout[row][lastColNum + 1] ={
                                                                spans:{row:1,col:1},
                                                                merged:{isMerged: false, lastMergedBottomRightCellId: ''},
                                                                hidden:{isHidden: false, hidingCellId: ''}
                                                            }
    }
    selectedUserComponent.recalculateRatios(0,1);
    loadTable(gridWidth, gridHeight, selectedUserComponent);

}

/**
 * Remove end columns
 * Does nothing if there is only one column left
 * Mutates selectedUserComponent
 */
function removeEndCol() {
    var lastColNum = parseInt(selectedUserComponent.dimensions.cols);
    if (lastColNum == 1){
        return
    }
    selectedUserComponent.dimensions.cols = lastColNum - 1;
    numCols -= 1;
    for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
        delete selectedUserComponent.layout[row][lastColNum];
    }

    selectedUserComponent.recalculateRatios(0,-1);
    loadTable(gridWidth, gridHeight, selectedUserComponent);

}

function clearAll(){
    for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++){
        clearRow(row);
    }
}

function clearRow(row){
    for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++){
        var cellId = 'cell' + '_' + row + '_' + col;
        deleteComponent(cellId);
    }

}

function clearCol(col){
    for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++){
        var cellId = 'cell' + '_' + row + '_' + col;
        deleteComponent(cellId);
    }
}