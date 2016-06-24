// This file mostly has functions that work to make and display
// the table, and functions that work with editing the datatype
// (which is mostly connected to the table)


/** ** ** ** ** ** ** Table Related Functions ** ** ** ** ** ** **/

/**
 * Creates and displays a table based on the component given
 * @param componentToShow
 */
function loadTable(componentToShow) {
    $('<style>.main-table::after{content:"' + componentToShow.meta.name + '"}</style>').appendTo('head');
    numRows = componentToShow.dimensions.rows;
    numCols = componentToShow.dimensions.cols;
    createTable();

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


/** ** ** Cell/Grid/Row/Col creation helpers ** ** ** **/

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

/** ** ** Table, Grid, Merge-Handler Creation Functions ** ** ** **/

/**
 * Generate the table
 */
function createTable() {
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
    addClearButtons();
    addDeleteUserComponentButton();

    bitmapOld = make2dArray(numRows, numCols);
    bitmapNew = make2dArray(numRows, numCols);

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


function attachMergeHandlers() {
    $('#drag-handle-containers-container').html('');
    for (var row = 1; row <= numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            var dragHandleContainer = document.createElement('div');
            dragHandleContainer.id = 'drag-handle-container' + '_' + row + '_' + col;

            var dragHandle_se = document.createElement('span');
            dragHandle_se.innerHTML = '<img src="images/drag_handle_se_icon.png" width="15px" height="15px">';
            dragHandle_se.className = 'ui-resizable-handle ui-resizable-se drag-handle';
            dragHandle_se.id = 'drag-handle-se' + '_' + row + '_' + col;

            var dragHandle_sw = document.createElement('span');
            dragHandle_sw.innerHTML = '<img src="images/drag_handle_sw_icon.png" width="15px" height="15px">';
            dragHandle_sw.className = 'ui-resizable-handle ui-resizable-sw drag-handle';
            dragHandle_sw.id = 'drag-handle-sw' + '_' + row + '_' + col;

            var dragHandle_ne = document.createElement('span');
            dragHandle_ne.innerHTML = '<img src="images/drag_handle_ne_icon.png" width="15px" height="15px">';
            dragHandle_ne.className = 'ui-resizable-handle ui-resizable-ne drag-handle';
            dragHandle_ne.id = 'drag-handle-ne' + '_' + row + '_' + col;

            var dragHandle_nw = document.createElement('span');
            dragHandle_nw.innerHTML = '<img src="images/drag_handle_nw_icon.png" width="15px" height="15px">';
            dragHandle_nw.className = 'ui-resizable-handle ui-resizable-nw drag-handle';
            dragHandle_nw.id = 'drag-handle-nw' + '_' + row + '_' + col;


            dragHandleContainer.appendChild(dragHandle_se);
            dragHandleContainer.appendChild(dragHandle_sw);
            dragHandleContainer.appendChild(dragHandle_ne);
            dragHandleContainer.appendChild(dragHandle_nw);

            $('#drag-handle-containers-container').append(dragHandleContainer);
            resetMergeHandleContainerSizeAndPosition(row, col);

            $([dragHandle_se, dragHandle_ne, dragHandle_sw, dragHandle_nw]).mouseenter(function (event, ui) {
                $(this).parent().css({
                    border: 'black 1px dotted'
                });
            });

            $([dragHandle_se, dragHandle_ne, dragHandle_sw, dragHandle_nw]).mouseleave(function (event, ui) {
                $(this).parent().css({
                    border: 'none'
                });
            });

            $(dragHandle_se).css({
                'pointer-events': 'auto',
                position: 'absolute',
                bottom: '5px',
                right: '5px',
                cursor: 'nwse-resize',
            });

            $(dragHandle_sw).css({
                'pointer-events': 'auto',
                position: 'absolute',
                bottom: '5px',
                left: '5px',
                cursor: 'nesw-resize',
            });

            $(dragHandle_ne).css({
                'pointer-events': 'auto',
                position: 'absolute',
                top: '5px',
                right: '5px',
                cursor: 'nesw-resize',
            });

            $(dragHandle_nw).css({
                'pointer-events': 'auto',
                position: 'absolute',
                top: '5px',
                left: '5px',
                cursor: 'nwse-resize',
            });

            $(dragHandleContainer).resizable({
                handles: {
                    'se': '#drag-handle-se' + '_' + row + '_' + col,
                    'sw': '#drag-handle-sw' + '_' + row + '_' + col,
                    'ne': '#drag-handle-ne' + '_' + row + '_' + col,
                    'nw': '#drag-handle-nw' + '_' + row + '_' + col
                },
                start: function (event, ui) {
                    $('#guide-grid-container td').css({
                        border: '#cdcdcd 1px dotted',
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
                    var thisCellId = 'cell' + '_' + row + '_' + col;

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
                        mergeCells(thisCellId, thisCellId, component);
                    } else {
                        var newCellGridRowcol = newCellGrid[0].id.split('_');
                        var newCellId = 'cell' + '_' + newCellGridRowcol[newCellGridRowcol.length - 2] + '_' + newCellGridRowcol[newCellGridRowcol.length - 1];
                        // TODO: have a setting to turn this off?
                        if (confirmOnDangerousMerge){
                            if (safeToMerge(thisCellId, newCellId)){
                                mergeCells(thisCellId, newCellId, component);
                            } else {
                                openMergeConfirmDialogue(thisCellId, newCellId);
                            }
                        } else {
                            mergeCells(thisCellId, newCellId, component);
                        }
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

            var isHidden = selectedUserComponent.layout[row][col].hidden.isHidden;

            if (isHidden) { // and thus also colspan
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

/** ** ** ** ** ** ** ** ** Merging and unmerging cells ** ** ** ** ** ** ** ** ** ** **/
function getTopRowBottomRowLeftColRightCol(cell1Id, cell2Id){
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

    return [topRowNum, bottomRowNum, leftColNum, rightColNum]
}

function safeToMerge(cell1Id, cell2Id){
    // first check for top left cell and bottom right cell
    var topBottomLeftRight = getTopRowBottomRowLeftColRightCol(cell1Id, cell2Id);
    var topRowNum = topBottomLeftRight[0];
    var bottomRowNum = topBottomLeftRight[1];

    var leftColNum = topBottomLeftRight[2];
    var rightColNum = topBottomLeftRight[3];

    for (var row = topRowNum; row <= bottomRowNum; row++) {
        for (var col = leftColNum; col <= rightColNum; col++) {
            var cellId = "cell" + '_' + row.toString() + '_' + col.toString();
            if (cellId === cell1Id){
                continue;
            }
            if (selectedUserComponent.components[row]) {
                if (selectedUserComponent.components[row][col]) {
                    return false;
                }
            }
        }
    }
    return true;
}


function openMergeConfirmDialogue(cell1Id, cell2Id){
    $('#confirm-merge').modal('show');
    $('#merge-btn').data('cell1Id', cell1Id).data('cell2Id',cell2Id);
};

$('#merge-btn').click(function(){
    var cell1Id =  $('#merge-btn').data('cell1Id');
    var cell2Id =  $('#merge-btn').data('cell2Id');

    var rowcol1 = cell1Id.split('_');
    var row1 = rowcol1[rowcol1.length - 2];
    var col1 = rowcol1[rowcol1.length - 1];

    if (selectedUserComponent.components[row1]){
        mergeCells(cell1Id, cell2Id, selectedUserComponent.components[row1][col1]);
    } else {
        mergeCells(cell1Id, cell2Id);
    }

    $('#merge-btn').data('cell1Id', '').data('cell2Id','');
});

$('#merge-cancel-btn').click(function(){
    var cell1Id =  $('#merge-btn').data('cell1Id');

    var rowcol1 = cell1Id.split('_');
    var row1 = rowcol1[rowcol1.length - 2];
    var col1 = rowcol1[rowcol1.length - 1];

    if (selectedUserComponent.components[row1]){
        mergeCells(cell1Id, cell1Id, selectedUserComponent.components[row1][col1]);
    } else {
        mergeCells(cell1Id, cell1Id);
    }

    $('#merge-btn').data('cell1Id', '').data('cell2Id','');
    $('#confirm-merge').modal('hide');
});

$('#confirm-merge .close').click(function(event){
    event.preventDefault();
    var cell1Id =  $('#merge-btn').data('cell1Id');

    var rowcol1 = cell1Id.split('_');
    var row1 = rowcol1[rowcol1.length - 2];
    var col1 = rowcol1[rowcol1.length - 1];

    if (selectedUserComponent.components[row1]){
        mergeCells(cell1Id, cell1Id, selectedUserComponent.components[row1][col1]);
    } else {
        mergeCells(cell1Id, cell1Id);
    }

    $('#merge-btn').data('cell1Id', '').data('cell2Id','');
    $('#confirm-merge').modal('hide');
});

function mergeCells(cell1Id, cell2Id, component) {
    // first check for top left cell and bottom right cell
    var topBottomLeftRight = getTopRowBottomRowLeftColRightCol(cell1Id, cell2Id);
    var topRowNum = topBottomLeftRight[0];
    var bottomRowNum = topBottomLeftRight[1];

    var leftColNum = topBottomLeftRight[2];
    var rightColNum = topBottomLeftRight[3];

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
                deleteComponentFromUserComponentAndFromView(cellId);

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

    // update the datatype
    selectedUserComponent.layout[topRowNum][leftColNum].spans = {row:rowspan,col:colspan};
    selectedUserComponent.layout[topRowNum][leftColNum].merged = {isMerged: true, lastMergedBottomRightCellId: bottomRightCellId};
    selectedUserComponent.layout[topRowNum][leftColNum].hidden = {isHidden: false, hidingCellId: ''};


    // then put the component in there
    if (component) {
        // add the component to the cell
        displayComponentInTable(topLeftCellId, false, component);
    }

    resetAllMergeHandleContainersSizeAndPosition();

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
            deleteComponentFromUserComponentAndFromView(cellId);

            var dragContainerToShow = $('#drag-handle-container' + '_' + row + '_' + col);
            dragContainerToShow.css({
                display: 'block',
            });

        }
    }

    if (component) {
        // add the component to the cell
        displayComponentInTable(topLeftCellId, false, component);
    }

    resetAllMergeHandleContainersSizeAndPosition();
}

function resetAllMergeHandleContainersSizeAndPosition(){
    for (var row = 1; row <= numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            resetMergeHandleContainerSizeAndPosition(row,col);
        }
    }
}

function resetMergeHandleContainerSizeAndPosition(row, col){
    var cell = $("#cell" + '_' + row + '_' + col);
    var containersContainer = $('#drag-handle-containers-container');

    var containersContainerOffset = containersContainer.offset();
    var cellOffset = cell.offset();
    var width = cell.css("width");
    var height = cell.css("height");

    var dragHandleContainer = $('#drag-handle-container' + '_' + row + '_' + col);

    dragHandleContainer.css({
        position: 'absolute',
        top: cellOffset.top - containersContainerOffset.top,
        left: cellOffset.left - containersContainerOffset.left,
        width: width,
        height: height,
        'pointer-events': 'none',
    });
}



function alignCellsWithGrid(){
    for (var row = 1; row <= numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            var grid = $("#grid" + '_' + row + '_' + col);
            var cell = $("#cell" + '_' + row + '_' + col);

            var width = grid.css("width");
            var height = grid.css("height");

            cell.css({
                width: width,
                height: height,
            });
        }
    }

}

/**
 * Resize cell such that all cells fill width and height of grid
 * @param numRows
 * @param numCols
 */
function initialResizeCells(numRows, numCols) {
    if (!selectedUserComponent.layout.tablePxDimensions.isSet){
        selectedUserComponent.layout.tablePxDimensions.width = gridWidth;
        selectedUserComponent.layout.tablePxDimensions.height = gridHeight;
        selectedUserComponent.layout.tablePxDimensions.isSet = true;
    } else {
        gridWidth = selectedUserComponent.layout.tablePxDimensions.width;
        gridHeight = selectedUserComponent.layout.tablePxDimensions.height;
        //$('.main-table').css({
        //    width: gridWidth,
        //    height: gridHeight
        //})
    }

    cellWidth = ((gridWidth-20) / numCols);
    cellHeight = ((gridHeight-20) / numRows);

    //console.log(cellWidth);
    //console.log(cellHeight);

    for (var row = 1; row<=numRows; row++){
        for (var col = 1; col<=numCols; col++){
            var widthRatio = selectedUserComponent.layout[row][col].ratio.width;
            var heightRatio = selectedUserComponent.layout[row][col].ratio.height;
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

    saveRowColRatios(); // adding rows/cols changes the ratios, so...
                        // although, it doesn't actually matter since if no row/col is resized, then the table size isn't
                        // updated, so the old ratios still work
                        // but if they are resized, the table size is updated but so are the ratios!
                        // But I would like the ratios to always be 1.

    //getCSSRule('td').style.setProperty('width', cellWidth + 'px', null);
    //getCSSRule('td').style.setProperty('height', cellHeight + 'px', null);
    getCSSRule('.tooltip').style.setProperty('left', -1 * Math.floor((tooltipWidth - (cellWidth - 40)) / 2) + 'px', null);

    resizeLabelDivs(cellWidth, cellHeight);

}


/** ** ** Row/Col add/delete and resize functions ** ** ** **/


function addRowColResizeHandlers(){
    // Have a resizable on the rows
    // once resize is stopped, loop through all the rows/cols, and store the
    // col-width/table-width or col-height/table-height or something similar
    //
    //  Then also set the cell size in load table (or resize function) based on these values

    for (var row = 1; row <= numRows; row++) {
        $('#guide-grid-container .row_' + row).resizable({
            handles: 's',
            alsoResize: '#table-container .row_' + row + ' .cell, ' +  // also resize the td's
                            '#guide-grid-container .row_' + row + ' .grid,' + // also resize the td's
                            ' #guide-grid-container .row_' + row + ', ' +
                            '#drag-handle-containers-container .row_' + row + ', ' +
                            //'#table-container .row_' + row + ' .ui-resizable-s' +
                            ' .ui-resizable-s-row_'+row,
            resize: function () {
                // TODO get rid of this later!
                //resetAllMergeHandleContainersSizeAndPosition();
            },
            stop: function () {
                alignCellsWithGrid();
                resetAllMergeHandleContainersSizeAndPosition();
                saveRowColRatios();
            }
        });

        $('#guide-grid-container .row_' + row).css({
            position: 'relative',
            width: $('#table-container .row_' + row).css('width'),
            height: $('#table-container .row_' + row).css('height')
        })

        var handle = document.createElement('div');
        $(handle).addClass('glyphicon glyphicon-resize-vertical ');

        $('#guide-grid-container .row_' + row + ' .ui-resizable-s').addClass('ui-resizable-s-row_'+row).append(handle).css({
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
            height: 0,
            visibility: 'visible',
            'pointer-events': 'auto',
            opacity: 3
        })


    }

    for (var col = 1; col <= numCols; col++) {
        $('#grid_1_' + col).resizable({ //there is always at least 1 cell, and grids can't merge
            handles: 'ew',
            alsoResize: '#table-container .col_' + col + ',' + // the td's are already resized!
                        '#guide-grid-container .col_' + col + ', ' +
                        '#drag-handle-containers-container .col_' + col,
            resize: function () {
                // TODO: move to stop() once the cell resize handles are made invisible
                //resetAllMergeHandleContainersSizeAndPosition();
            },
            stop: function () {
                alignCellsWithGrid();
                resetAllMergeHandleContainersSizeAndPosition();
                saveRowColRatios();
            }
        });

        $('#grid_1_' + col + ' .ui-resizable-ew').addClass('glyphicon glyphicon-resize-horizontal').css({
            cursor: 'ew-resize',
            position: 'absolute',
            top: '-15px',
            left: 'auto',
            right: '5px',
            width: 0,
            height: 0,
            visibility: 'visible',
            'pointer-events': 'auto',
            opacity: 3
        });


    }
}

function addTableResizeHandler(){
    // TODO THIS DOES NOT WORK!
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
            resetAllMergeHandleContainersSizeAndPosition();
        },
        stop: function () {
            resetAllMergeHandleContainersSizeAndPosition();
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

function saveRowColRatios(){
    // save the new table dimensions
    selectedUserComponent.layout.tablePxDimensions.width = parseFloat($('#main-cell-table').css('width'));
    selectedUserComponent.layout.tablePxDimensions.height = parseFloat($('#main-cell-table').css('height'));
    gridWidth = selectedUserComponent.layout.tablePxDimensions.width;
    gridHeight = selectedUserComponent.layout.tablePxDimensions.height;

    for (var row = 1; row<=numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            var grid = $('#grid' + '_' + row + '_' + col); //grid is better to use?, since cells can merge with other cells
            var cellWidth = parseFloat(grid.css('width'));
            var cellHeight = parseFloat(grid.css('height'));
            var widthRatio = cellWidth/(gridWidth-20);
            var heightRatio = cellHeight/(gridHeight-20);

            selectedUserComponent.layout[row][col].ratio.width = widthRatio;
            selectedUserComponent.layout[row][col].ratio.height = heightRatio;
        }
    }

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
            hidden:{isHidden: false, hidingCellId: ''},
            // take the width of the cell to the top
            ratio:{width: selectedUserComponent.layout[lastRowNum][col].ratio.width, height: standardCellHeight/gridHeight}
        }

    }

    //selectedUserComponent.recalculateRatios(1,0);
    loadTable(selectedUserComponent);


}

/**
 * Removes the end row
 * Does nothing if there is only one row left
 * Mutates selectedUserComponent
 */
function removeEndRow() {
    var cellsNeedingRowspanCut = {};

    var lastRowNum = parseInt(selectedUserComponent.dimensions.rows);

    if (lastRowNum == 1){
        return
    }

    selectedUserComponent.dimensions.rows = lastRowNum - 1;
    numRows -= 1;
    for (var col = 1; col <= selectedUserComponent.dimensions.rows; col++) {
        var isHidden = selectedUserComponent.layout[lastRowNum][col].hidden.isHidden;
        var hidingCellId = selectedUserComponent.layout[lastRowNum][col].hidden.hidingCellId;
        if (isHidden){
            if (!(hidingCellId in cellsNeedingRowspanCut)){
                cellsNeedingRowspanCut[hidingCellId] = '';
                var hcRowcol = hidingCellId.split('_');
                var hcRow = Number(hcRowcol[hcRowcol.length - 2]);
                var hcCol = Number(hcRowcol[hcRowcol.length - 1]);

                var rowspan = selectedUserComponent.layout[hcRow][hcCol].spans.row;
                $('#'+hidingCellId).attr('rowspan', rowspan - 1);
                selectedUserComponent.layout[hcRow][hcCol].spans.row = rowspan - 1;
            }
        }
    }

    delete selectedUserComponent.layout[lastRowNum];

    //selectedUserComponent.recalculateRatios(-1,0);
    loadTable(selectedUserComponent);

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
            hidden:{isHidden: false, hidingCellId: ''},
            // take the height of the cell to the left
            ratio:{width: standardCellWidth/gridWidth, height: selectedUserComponent.layout[row][lastColNum].ratio.height}
        }
    }
    //selectedUserComponent.recalculateRatios(0,1);
    loadTable(selectedUserComponent);

}

/**
 * Remove end columns
 * Does nothing if there is only one column left
 * Mutates selectedUserComponent
 */
function removeEndCol() {
    var cellsNeedingColspanCut = {};

    var lastColNum = parseInt(selectedUserComponent.dimensions.cols);
    if (lastColNum == 1){
        return
    }
    selectedUserComponent.dimensions.cols = lastColNum - 1;
    numCols -= 1;
    for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
        var isHidden = selectedUserComponent.layout[row][lastColNum].hidden.isHidden;
        var hidingCellId = selectedUserComponent.layout[row][lastColNum].hidden.hidingCellId;
        if (isHidden){
            if (!(hidingCellId in cellsNeedingColspanCut)){
                cellsNeedingColspanCut[hidingCellId] = '';
                var hcRowcol = hidingCellId.split('_');
                var hcRow = Number(hcRowcol[hcRowcol.length - 2]);
                var hcCol = Number(hcRowcol[hcRowcol.length - 1]);

                var colspan = selectedUserComponent.layout[hcRow][hcCol].spans.col;
                $('#'+hidingCellId).attr('colspan', colspan - 1);
                selectedUserComponent.layout[hcRow][hcCol].spans.col = colspan - 1;
            }
        }


        delete selectedUserComponent.layout[row][lastColNum];
    }

    //selectedUserComponent.recalculateRatios(0,-1);
    loadTable(selectedUserComponent);

}





/**
 * Add buttons to clear a row, a column or the entire table of its components
 */
function addClearButtons(){
    addClearAllButton();
}

function addClearAllButton(){
    var spClearAll = document.createElement('span');
    spClearAll.innerHTML = '<button type="button" class="btn btn-default ">' +
        '<span>Clear All </span>' +
        '<span class="glyphicon glyphicon-remove"></span>' +
        '</button>';

    var buttonClearAll = spClearAll.firstChild;
    buttonClearAll.id = 'btn-clear-all';

    $(buttonClearAll).on("click", function (e) {
        clearAll();
    });

    $('#main-cell-table').append(buttonClearAll);
    $(buttonClearAll).css({
        position: 'absolute',
        top:'-45px',
        right:'-140px'
    })
}

function clearAll(){
    for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++){
        clearRow(row);
    }
}

function clearRow(row){
    for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++){
        var cellId = 'cell' + '_' + row + '_' + col;
        deleteComponentFromUserComponentAndFromView(cellId);
    }

}

function clearCol(col){
    for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++){
        var cellId = 'cell' + '_' + row + '_' + col;
        deleteComponentFromUserComponentAndFromView(cellId);
    }
}

/** ** ** ** ** ** ** Delete UserComponent Functions ** ** ** ** ** ** ** ** ** **/


function addDeleteUserComponentButton(){
    // TODO add a waring tag!
    var spDelete = document.createElement('span');
    spDelete.innerHTML = '<button type="button" class="btn btn-default ">' +
        '<span>Delete User Component </span>' +
        '<span class="glyphicon glyphicon-trash"></span>' +
        '</button>';

    var buttonClearAll = spDelete.firstChild;
    buttonClearAll.id = 'btn-clear-all';

    $(buttonClearAll).on("click", function (e) {
        if (selectedProject.numComponents === 1){
            return; //don't delete the last one TODO is the the right way to go?
        }
        if (confirmOnUserComponentDelete){
            openDeleteUserComponentConfirmDialogue(selectedUserComponent.meta.id);
        } else {
            deleteUserComponent(selectedUserComponent.meta.id);
        }
    });

    $('#main-cell-table').append(buttonClearAll);
    $(buttonClearAll).css({
        position: 'absolute',
        top:'-100px',
        right:'-150px',
        background: 'red',
        color: 'white'
    })
}

function deleteUserComponent(userComponentId){
    if (selectedProject.numComponents === 1){
        return; //don't delete the last one TODO is the the right way to go?
    }
    delete selectedProject.components[userComponentId];
    if (userComponentId === selectedUserComponent.meta.id){
        var otherIds = Object.keys(selectedProject.components);
        selectedUserComponent = selectedProject.components[otherIds[0]];
        $("#user-components-list").find("[data-componentid='" + otherIds[0] + "']").attr('id', 'selected');
        loadTable(selectedUserComponent);
    }
    $("#user-components-list").find("[data-componentid='" + userComponentId + "']").remove();

}

function openDeleteUserComponentConfirmDialogue(userComponentId){
    $('#confirm-delete-userComponent').modal('show');
    $('#delete-userComponent-name').text(selectedProject.components[userComponentId].meta.name);
    $('#delete-userComponent-btn').data('deleteUserComponentId', userComponentId);
};

$('#delete-userComponent-btn').click(function(){
    var userComponentId =  $('#delete-userComponent-btn').data('deleteUserComponentId');
    deleteUserComponent(userComponentId);

    $('#delete-userComponent-btn').data('deleteUserComponentId', '');

    $('#delete-userComponent-name').text('');
});

$('#delete-userComponent-cancel-btn').click(function(){
    $('#delete-userComponent-btn').data('deleteUserComponentId', '');

    $('#delete-userComponent-name').text('');
});

$('#confirm-delete-userComponent .close').click(function(event){
    event.preventDefault();
    $('#delete-userComponent-btn').data('deleteUserComponentId', '');
    $('#confirm-delete-userComponent').modal('hide');

    $('#delete-userComponent-name').text('');
});


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



/** ** ** ** ** ** BITMAP TO HELP IN UPDATE  ** ** ** ** ** ** **/

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


