// This file mostly has functions that work to make and display
// the table, and functions that work with editing the datatype
// (which is mostly connected to the table)

/** ** ** ** ** Global variables for this file ** ** ** ** ** **/
const DEFAULT_CONTAINER_WIDTH = '3000px';
const DEFAULT_CONTAINER_HEIGHT = '3000px';

var tableLockedResizeRow = false;
var tableLockedWidth = false;


var start;


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

    $('.cell').each(function () {
        var cellId = $(this).get(0).id;
        var rowcol = getRowColFromId(cellId);
        var row = rowcol.row;
        var col = rowcol.col;
        if (componentToShow.components[row]) {
            if (componentToShow.components[row][col]) {
                var innerComponent = componentToShow.components[row][col];
                var type = innerComponent.type;
                showConfigOptions(type, document.getElementById(cellId));

                $($('.draggable[name=' + type + ']').get(0)).clone().appendTo($('#' + cellId).get(0));
                Display(cellId, getHTML[type](innerComponent.components[type]));
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
        var rowcol = getRowColFromId(this.id);
        $('#cell' + '_' + rowcol.row + '_' + rowcol.col).find('.tooltip').addClass('open');
    });

    // change size of cell based on the layout
    var rowspan = selectedUserComponent.layout[row][col].spans.row;
    var colspan = selectedUserComponent.layout[row][col].spans.col;

    var isMerged = selectedUserComponent.layout[row][col].merged.isMerged;
    var topLeftCellId = selectedUserComponent.layout[row][col].merged.topLeftCellId;
    var topRightCellId = selectedUserComponent.layout[row][col].merged.topRightCellId;
    var bottomLeftCellId = selectedUserComponent.layout[row][col].merged.bottomLeftCellId;
    var bottomRightCellId = selectedUserComponent.layout[row][col].merged.bottomRightCellId;

    var isHidden = selectedUserComponent.layout[row][col].hidden.isHidden;
    var hidingCellIdId = selectedUserComponent.layout[row][col].hidden.hidingCellId;

    $(td).data('merged', {isMerged:isMerged,
        topLeftCellId: topLeftCellId,
        topRightCellId: topRightCellId,
        bottomLeftCellId: bottomLeftCellId,
        bottomRightCellId: bottomRightCellId});
    $(td).data('hidden', {isHidden:isHidden, hidingCellId: hidingCellIdId});


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
    for (var row = 0; row <= numRows; row++) {
        var tr = createEmptyRow(row);
        for (var col = 0; col <= numCols; col++) {
            if ((row === 0)||(col === 0)){
                if (row === 0){
                    if (col===0){
                        var td = document.createElement('td');
                        td.className = 'zero-height zero-width col' + '_' + col;
                        td.id = 'cell' + '_' + row + '_' + col;
                    } else {
                        var td = document.createElement('td');
                        td.className = 'zero-height col' + '_' + col;
                        td.id = 'cell' + '_' + row + '_' + col;
                    }
                } else {
                    var td = document.createElement('td');
                    td.className = 'zero-width col' + '_' + col;
                    td.id = 'cell' + '_' + row + '_' + col;
                }
            } else {
                var td = createTableCell(row, col);
            }
            tr.appendChild(td);

        }
        tableGrid.appendChild(tr);

    }

    document.getElementById('table-container').appendChild(tableGrid);

    createGuideGrid();
    initialResizeCells();

    attachMergeHandlers();
    registerDroppable();
    addRowColAddRemoveButtons();

    addRowColResizeHandlers();
    addTableResizeHandler();
    addTableSizeLockUnlockButton();
    addClearButtons();
    addAddToMainPagesButton();


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


            $(dragHandleContainer).resizable({
                handles: {
                    'se': '#drag-handle-se' + '_' + row + '_' + col,
                    'sw': '#drag-handle-sw' + '_' + row + '_' + col,
                    'ne': '#drag-handle-ne' + '_' + row + '_' + col,
                    'nw': '#drag-handle-nw' + '_' + row + '_' + col
                },
                start: function (event, ui) {
                    $('.grid').css({
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
                    var rowcol = getRowColFromId(containerId);
                    var row = rowcol.row;
                    var col = rowcol.col;
                    var thisCellId = 'cell' + '_' + row + '_' + col;

                    var handleType = $(ui.element).data("ui-resizable").axis;

                    // this will be one of the cell id's input into the merge function
                    var cell1Id = thisCellId;
                    if ($('#'+thisCellId).data('merged').isMerged){
                        switch(handleType){
                            case 'ne':
                                cell1Id = $('#'+thisCellId).data('merged').bottomLeftCellId;
                                break;
                            case 'nw':
                                cell1Id = $('#'+thisCellId).data('merged').bottomRightCellId;
                                break;
                            case 'se':
                                cell1Id = $('#'+thisCellId).data('merged').topLeftCellId;
                                break;
                            case 'sw':
                                cell1Id = $('#'+thisCellId).data('merged').topRightCellId;
                                break;
                            default:
                                throw 'Something went wrong'; // TODO
                        }
                    }

                    // extract the component from this cell
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
                    $('.grid').css({
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
                    $('.grid').css({
                        'z-index': 0,
                        visibility: 'hidden',
                        'pointer-events': 'none',
                    });

                    var newCellGrid = $(allEltsList).filter('.grid');
                    if (!newCellGrid[0]) { // it's outside the table
                        resetMergeHandleContainerSizeAndPositionCellId(thisCellId);
                    } else {
                        var newCellGridRowcol = getRowColFromId(newCellGrid[0].id);
                        var newCellId = 'cell' + '_' + newCellGridRowcol.row + '_' + newCellGridRowcol.col;
                        // TODO: have a setting to turn this off?
                        if (confirmOnDangerousMerge){
                            if (safeToMerge(cell1Id, newCellId)){
                                // if this is already a merged cell we should unmerge it now
                                // since this cell (a top left cell), may not be in the final merge
                                // so should be brought back to the original form
                                unmergeCells(thisCellId); // without the component; it will get it back if it was its
                                mergeCells(cell1Id, newCellId, component);
                            } else {
                                openMergeConfirmDialogue(thisCellId, cell1Id, newCellId, component);
                            }
                        } else {
                            unmergeCells(thisCellId);
                            mergeCells(cell1Id, newCellId, component);
                        }
                    }

                    // rest event handlers
                    $('.grid').css({
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


            // putting these css modifiers later to override any native drag handle css
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

            $([dragHandle_se, dragHandle_ne, dragHandle_sw, dragHandle_nw]).css({
                display: 'none',
                'pointer-events': 'auto',
                position: 'absolute',
            });

            $(dragHandle_se).css({
                bottom: '5px',
                right: '5px',
                cursor: 'nwse-resize',
            });

            $(dragHandle_sw).css({
                bottom: '5px',
                left: '5px',
                cursor: 'nesw-resize',
            });

            $(dragHandle_ne).css({
                top: '5px',
                right: '5px',
                cursor: 'nesw-resize',
            });

            $(dragHandle_nw).css({
                top: '5px',
                left: '5px',
                cursor: 'nwse-resize',
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


//$('#table-container').on('mouseenter', '.cell', function(){
//    var rowcol = getRowColFromId(this.id);
//    var row = rowcol.row;
//    var col = rowcol.col;
//    $('#drag-handle-container'+'_'+row+'_'+col).find('.drag-handle').css({
//        display: 'inline',
//    });
//}).on('mouseleave', '.cell', function(){
//    var rowcol = getRowColFromId(this.id);
//    var row = rowcol.row;
//    var col = rowcol.col;
//    $('#drag-handle-container'+'_'+row+'_'+col).find('.drag-handle').css({
//        display: 'none',
//    });
//});

$('#table-container').on('click', '.cell', function(){
    var showMergeHandles = (!$(this).data('show-merge-handles')); // whether or not to show after a click is
    var rowcol = getRowColFromId(this.id);
    var row = rowcol.row;
    var col = rowcol.col;
    // the opposite of what it is before the click!
    if (showMergeHandles){
        $('#drag-handle-container'+'_'+row+'_'+col).find('.drag-handle').css({
            display: 'inline',
        });
    } else {
        $('#drag-handle-container'+'_'+row+'_'+col).find('.drag-handle').css({
            display: 'none',
        });
    }
    // now store the current state
    $(this).data('show-merge-handles', showMergeHandles)
});


/** ** ** ** ** ** ** ** ** Merging and unmerging cells ** ** ** ** ** ** ** ** ** ** **/
function getTopRowBottomRowLeftColRightCol(cell1Id, cell2Id){
    var rowcol1 =getRowColFromId(cell1Id);
    var row1 = rowcol1.row;
    var col1 = rowcol1.col;

    var rowcol2 = getRowColFromId(cell2Id);
    var row2 = rowcol2.row;
    var col2 = rowcol2.col;


    var topRowNum = Math.min(parseInt(row1), parseInt(row2));
    var bottomRowNum = Math.max(parseInt(row1), parseInt(row2));

    var leftColNum = Math.min(parseInt(col1), parseInt(col2));
    var rightColNum = Math.max(parseInt(col1), parseInt(col2));

    return [topRowNum, bottomRowNum, leftColNum, rightColNum]
}

/**
 *  Cell1 is the one merging over
 * @param cell1Id
 * @param cell2Id
 * @returns {boolean}
 */
function safeToMerge(cell1Id, cell2Id){
    // first check for top left cell and bottom right cell
    var topBottomLeftRight = getTopRowBottomRowLeftColRightCol(cell1Id, cell2Id);
    var topRowNum = topBottomLeftRight[0];
    var bottomRowNum = topBottomLeftRight[1];

    var leftColNum = topBottomLeftRight[2];
    var rightColNum = topBottomLeftRight[3];

    for (var row = topRowNum; row <= bottomRowNum; row++) {
        for (var col = leftColNum; col <= rightColNum; col++) {
            var cellId = "cell" + '_' + row + '_' + col;
            if (cellId === cell1Id){
                continue;
            }
            // if the cell is hidden, check if the hiding cell has a component
            var isHidden = $('#'+cellId).data('hidden').isHidden;
            if (isHidden){
                var hidingCellId = $('#'+cellId).data('hidden').hidingCellId;
                var hcRowcol = getRowColFromId(hidingCellId);
                if (selectedUserComponent.components[hcRowcol.row]) {
                    if (selectedUserComponent.components[hcRowcol.row][hcRowcol.col]) {
                        return false;
                    }
                }
            }
            else { // check that cell
                if (selectedUserComponent.components[row]) {
                    if (selectedUserComponent.components[row][col]) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

/**
 *
 * @param oldTopLeftCellId
 * @param cell1Id
 * @param cell2Id
 * @param component
 */
function openMergeConfirmDialogue(oldTopLeftCellId, cell1Id, cell2Id, component){
    $('#confirm-merge').modal('show');

    $('#merge-btn').click(function(){
        mergeCells(cell1Id, cell2Id, component);
        $('#confirm-merge').modal('hide');
    });

    $('#merge-cancel-btn').click(function(){
        resetMergeHandleContainerSizeAndPositionCellId(oldTopLeftCellId);
        $('#confirm-merge').modal('hide');
    });

    $('#confirm-merge .close').click(function(event){
        event.preventDefault();
        resetMergeHandleContainerSizeAndPositionCellId(oldTopLeftCellId);
        $('#confirm-merge').modal('hide');
    });
};


/**
 * @param cell1Id
 * @param cell2Id
 * @param component
 */
function mergeCells(cell1Id, cell2Id, component) {
    // NOTE: despite which cell is actually expanding, only the topLeftCell, determined above
    // is the cell that will actually be expanded. Figuring out which cell1 and cell2 should be done
    // before calling this function


    // first check for top left cell and bottom right cell
    var topBottomLeftRight = getTopRowBottomRowLeftColRightCol(cell1Id, cell2Id);
    var topRowNum = topBottomLeftRight[0];
    var bottomRowNum = topBottomLeftRight[1];

    var leftColNum = topBottomLeftRight[2];
    var rightColNum = topBottomLeftRight[3];

    var topLeftCellId = "cell" + '_' + topRowNum.toString() + '_' + leftColNum.toString();
    var topRightCellId = "cell" + '_' + topRowNum.toString() + '_' + rightColNum.toString();
    var bottomLeftCellId = "cell" + '_' + bottomRowNum.toString() + '_' + leftColNum.toString();
    var bottomRightCellId = "cell" + '_' + bottomRowNum.toString() + '_' + rightColNum.toString();

    if (topLeftCellId != bottomRightCellId) { // not merging/unmerging to the same cell,
        // that is, the cell is actually merging to something else
        for (var row = topRowNum; row <= bottomRowNum; row++) {
            for (var col = leftColNum; col <= rightColNum; col++) {
                var cellId = "cell" + '_' + row.toString() + '_' + col.toString();

                // delete any component that was there
                deleteComponentFromUserComponentAndFromView(cellId);

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
                selectedUserComponent.layout[row][col].merged = {isMerged: false,
                                                                    topLeftCellId: '',
                                                                    topRightCellId: '',
                                                                    bottomLeftCellId: '',
                                                                    bottomRightCellId: ''};
                selectedUserComponent.layout[row][col].hidden = {isHidden: true, hidingCellId: topLeftCellId};
            }
        }

        // Make the first cell take the correct size
        var cellTopLeft = $("#" + topLeftCellId);
        var rowspan = bottomRowNum - topRowNum + 1;
        var colspan = rightColNum - leftColNum + 1;
        cellTopLeft.attr("rowSpan", rowspan);
        cellTopLeft.attr("colSpan", colspan);

        selectedUserComponent.layout[topRowNum][leftColNum].spans = {row:rowspan,col:colspan};

        // mark cell as merged and reset hiding status incase it was hidden before
        $('#' + topLeftCellId).data('merged', {isMerged: true,
            topLeftCellId: topLeftCellId,
            topRightCellId: topRightCellId,
            bottomLeftCellId: bottomLeftCellId,
            bottomRightCellId: bottomRightCellId
        });

        selectedUserComponent.layout[topRowNum][leftColNum].merged = {isMerged: true,
            topLeftCellId: topLeftCellId,
            topRightCellId: topRightCellId,
            bottomLeftCellId: bottomLeftCellId,
            bottomRightCellId: bottomRightCellId};
        selectedUserComponent.layout[topRowNum][leftColNum].hidden = {isHidden: false, hidingCellId: ''};



        $('#' + topLeftCellId).css({
            display: "table-cell",
        });

        // find the new width and height (after the cell merge data is updated)
        // this actually isn't necessary, but let's keep it until it proves to cause trouble
        //var widthheight = calculateMergedCellWidthHeight(topLeftCellId);
        //
        //
        //$('#' + topLeftCellId).css({
        //    display: "table-cell",
        //    width: widthheight.width+'px',
        //    height: widthheight.height+'px',
        //});
        //
        //selectedUserComponent.layout[topRowNum][leftColNum].ratio.cell = {width: widthheight.width/(gridWidth-20), height: widthheight.height/(gridHeight-20)};

        $('#' + topLeftCellId).data('hidden', {isHidden: false, hidingCellId: ''});

        var dragContainer = $('#drag-handle-container' + '_' + topRowNum + '_' + leftColNum);
        dragContainer.css('display', 'block');

    }

    // Do these even if the cell is just merging to itself



    // then put the component in there
    if (component) {
        // add the component to the cell
        displayComponentInTable(topLeftCellId, false, component);
    }

    showMergeHandle(topRowNum,leftColNum);
    resetAllMergeHandleContainersSizeAndPosition();

}

function unmergeCells(cellToUnmergeId, component) {
    var cellToUnmergeRowcol = getRowColFromId(cellToUnmergeId);
    var cellToUnmergeRow = cellToUnmergeRowcol.row;
    var cellToUnmergeCol = cellToUnmergeRowcol.col;


    var lastMergedCellBottomRightId = $('#' + cellToUnmergeId).data('merged').bottomRightCellId;
    if (lastMergedCellBottomRightId.length === 0){ // this is actually an unmerged cell
        lastMergedCellBottomRightId = cellToUnmergeId;
    }

    var lastMergedCellBottomRightRowcol = getRowColFromId(lastMergedCellBottomRightId);
    var lastMergedCellBottomRightRow = lastMergedCellBottomRightRowcol.row;
    var lastMergedCellBottomRightCol = lastMergedCellBottomRightRowcol.col;


    var topRowNum = Math.min(parseInt(cellToUnmergeRow), parseInt(lastMergedCellBottomRightRow));
    var bottomRowNum = Math.max(parseInt(cellToUnmergeRow), parseInt(lastMergedCellBottomRightRow));

    var leftColNum = Math.min(parseInt(cellToUnmergeCol), parseInt(lastMergedCellBottomRightCol));
    var rightColNum = Math.max(parseInt(cellToUnmergeCol), parseInt(lastMergedCellBottomRightCol));


    // Make the first cell take the correct size
    var topLeftCellId = "cell" + '_' + topRowNum.toString() + '_' + leftColNum.toString();

    var cellTopLeft = $("#" + topLeftCellId);
    cellTopLeft.attr("rowSpan", 1);
    cellTopLeft.attr("colSpan", 1);

    //var resetWidth = parseFloat($('#grid'+'_'+cellToUnmergeRow+'_'+cellToUnmergeCol).css('width'));
    //var resetHeight = parseFloat($('#grid'+'_'+cellToUnmergeRow+'_'+cellToUnmergeCol).css('height'));
    //
    //$(cellTopLeft).css({
    //    display: "table-cell",
    //    width: resetWidth+'px',
    //    height: resetHeight+'px',
    //});
    //
    //selectedUserComponent.layout[topRowNum][leftColNum].ratio.cell = {width: resetWidth/gridWidth, height: resetHeight/gridHeight};


    // display all the other cells in that block
    for (var row = topRowNum; row <= bottomRowNum; row++) {
        for (var col = leftColNum; col <= rightColNum; col++) {
            var cellId = "cell" + '_' + row.toString() + '_' + col.toString();
            // update the datatype
            selectedUserComponent.layout[row][col].spans = {row:1,col:1};
            selectedUserComponent.layout[row][col].merged = {isMerged: false,
                                                                topLeftCellId: '',
                                                                topRightCellId: '',
                                                                bottomLeftCellId: '',
                                                                bottomRightCellId: ''};
            selectedUserComponent.layout[row][col].hidden = {isHidden: false, hidingCellId: ''};


            var cellToShow = $("#" + cellId);
            cellToShow.css("display", "table-cell");

            // reset some meta data
            cellToShow.data('merged', {isMerged: false,
                                        topLeftCellId: '',
                                        topRightCellId: '',
                                        bottomLeftCellId: '',
                                        bottomRightCellId: ''});
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
            resetMergeHandleVisibility(row,col);
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

function resetMergeHandleContainerSizeAndPositionCellId(cellId){
    var rowcol = getRowColFromId(cellId);
    resetMergeHandleContainerSizeAndPosition(rowcol.row, rowcol.col);
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

function resetMergeHandleVisibility(row,col){
    var cell = $("#cell" + '_' + row + '_' + col);
    var dragHandleContainer = $('#drag-handle-container' + '_' + row + '_' + col);

    dragHandleContainer.find('.drag-handle').css({
        display: 'none',
    });

    cell.data('show-merge-handles', false)
}

function showMergeHandle(row,col){
    var cell = $("#cell" + '_' + row + '_' + col);
    var dragHandleContainer = $('#drag-handle-container' + '_' + row + '_' + col);

    dragHandleContainer.find('.drag-handle').css({
        display: 'block',
    });

    cell.data('show-merge-handles', true);
}


function resetAllMergeHandleVisibilityExcept(spRow,spCol) {
    for (var row = 1; row <= numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            if ((row!=spRow) && (col != spCol)){
                resetMergeHandleVisibility(row,col);
            }
        }
    }
}

// returns floats
function calculateMergedCellWidthHeight(cellId){
    var cell = $('#'+cellId);
    var rowcol = getRowColFromId(cellId);
    var row = rowcol.row;
    var col = rowcol.col;

    var grid = $("#grid" + '_' + row + '_' + col);

    var bottomRightCellId = cell.data('merged').bottomRightCellId;
    var bottomRightRowcol = getRowColFromId(bottomRightCellId);
    var bottomRowNum = bottomRightRowcol.row;
    var rightColNum = bottomRightRowcol.col;


    // find the new width and height
    var topLeftOffset = grid.offset()
    var bottomRightOffset = $('#grid' + '_' + bottomRowNum + '_' + rightColNum).offset();
    var bottomRightWidth = $('#grid' + '_' + bottomRowNum + '_' + rightColNum).css('width');
    var bottomRightHeight = $('#grid' + '_' + bottomRowNum + '_' + rightColNum).css('height');

    var newWidth = (parseFloat(bottomRightOffset.left) + parseFloat(bottomRightWidth) - parseFloat(topLeftOffset.left));
    var newHeight = (parseFloat(bottomRightOffset.top) + parseFloat(bottomRightHeight) - parseFloat(topLeftOffset.top));

    return {width: newWidth, height: newHeight};
}


function alignCellsAndGridWithSavedRatios(){
    resetAligners();
    for (var row = 1; row <= numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            var grid = $("#grid" + '_' + row + '_' + col);
            var cellId = "cell" + '_' + row + '_' + col;
            var cell = $('#'+cellId);

            var width = grid.css("width");
            var height = grid.css("height");

            var width = selectedUserComponent.layout[row][col].ratio.grid.width * (gridWidth-20);
            var height = selectedUserComponent.layout[row][col].ratio.grid.height * (gridHeight-20);


            //if (cell.data('merged').isMerged){
            //    var widthheight = calculateMergedCellWidthHeight(cellId);
            //
            //    cell.css({
            //        width: widthheight.width + 'px',
            //        height: widthheight.height + 'px',
            //    });
            //
            //} else {
            //    cell.css({
            //        width: width,
            //        height: height,
            //    });
            //}

            cell.css({
                width: width,
                height: height,
            });

            grid.css({
                width: width,
                height: height,
            });
        }
    }

}

/**
 * Resize cell such that all cells fill width and height of grid
 */
function initialResizeCells() {
    if (!selectedUserComponent.layout.tablePxDimensions.isSet){
        selectedUserComponent.layout.tablePxDimensions.width = DEFAULT_GRID_WIDTH;
        selectedUserComponent.layout.tablePxDimensions.height = DEFAULT_GRID_HEIGHT;
        selectedUserComponent.layout.tablePxDimensions.isSet = true;
    }

    gridWidth = selectedUserComponent.layout.tablePxDimensions.width;
    gridHeight = selectedUserComponent.layout.tablePxDimensions.height;

    cellWidth = ((gridWidth-20) / numCols);
    cellHeight = ((gridHeight-20) / numRows);

    resetAligners();

    for (var row = 1; row<=numRows; row++){
        for (var col = 1; col<=numCols; col++){
            //var widthRatioCell = selectedUserComponent.layout[row][col].ratio.cell.width;
            //var heightRatioCell = selectedUserComponent.layout[row][col].ratio.cell.height;
            //var thisCellWidth = widthRatioCell * (gridWidth - 20);
            //var thisCellHeight = heightRatioCell * (gridHeight - 20);


            var widthRatioGrid = selectedUserComponent.layout[row][col].ratio.grid.width;
            var heightRatioGrid = selectedUserComponent.layout[row][col].ratio.grid.height;
            var thisGridCellWidth = widthRatioGrid * (gridWidth - 20);
            var thisGridCellHeight = heightRatioGrid * (gridHeight - 20);

            $('#cell' + '_' + row + '_' + col).css({
                //width: thisCellWidth + 'px',
                //height: thisCellHeight + 'px',

                width: thisGridCellWidth + 'px',
                height: thisGridCellHeight + 'px',
            });
            $('#grid' + '_' + row + '_' + col).css({
                width: thisGridCellWidth + 'px',
                height: thisGridCellHeight + 'px',
            });
        }
    }

    console.log(getWidthSumGrid()/(gridWidth-20));

    var tooltipWidth = Number($('.tooltip').css('width').substring(0, 3));

    getCSSRule('.tooltip').style.setProperty('left', -1 * Math.floor((tooltipWidth - (cellWidth - 40)) / 2) + 'px', null);

    resizeLabelDivs(cellWidth, cellHeight);

    console.log(getWidthSumGrid()/(gridWidth-20));
}

function resetAligners() {
    $('#cell_0_0').css({
        width: '1px',
        height: '1px',
    });

    // 0th col
    for (var row = 1; row<=numRows; row++){
        var heightRatioGrid = selectedUserComponent.layout[row][1].ratio.grid.height;
        var thisGridCellHeight = heightRatioGrid * (gridHeight - 20);
        //var thisGridCellHeight = parseFloat($('#grid'+'_'+row+'_1').css('height'));

        $('#cell' + '_' + row + '_' + 0).css({
            width: '1px',
            height: thisGridCellHeight + 'px',
        })
    }

    // 0th row
    for (var col = 1; col<=numCols; col++) {
        var widthRatioGrid = selectedUserComponent.layout[1][col].ratio.grid.width;
        var thisGridCellWidth = widthRatioGrid * (gridWidth - 20);

        //var thisGridCellWidth = parseFloat($('#grid_1'+col).css('width'));

        $('#cell' + '_' + 0 + '_' + col).css({
            width: thisGridCellWidth + 'px',
            height: '1px',
        })

    }

}


function checkWidthRatio(row){
    var sum = 0;
    for (var col = 1; col <= numCols; col++){
        sum += selectedUserComponent.layout[row][col].ratio.grid.width;
    }
    console.log(sum);
}

function getWidthSumGrid(){
    var sum = 0;
    for (var col = 1; col <= numCols; col++){
        sum += parseFloat($('#grid_1_'+col).css('width'));
    }
    return sum
}


function getWidthSumCells(){
    var sum = 0;
    for (var col = 1; col <= numCols; col++){
        sum += parseFloat($('#cell_0_'+col).css('width'));
    }
    return sum
}


function checkHeightRatio(col){
    var sum = 0;
    for (var row = 1; row <= numRows; row++){
        sum += selectedUserComponent.layout[row][col].ratio.grid.height;
    }
    console.log(sum);
}

function getHeightSumGrid(){
    var sum = 0;
    for (var row = 1; row <= numRows; row++){
        sum += parseFloat($('#grid'+'_'+row+'_1').css('height'));
    }
    return sum;
}


function getHeightSumCells(){
    var sum = 0;
    for (var row = 1; row <= numRows; row++){
        sum += parseFloat($('#cell'+'_'+row+'_0').css('height'));
    }
    return sum;
}

/** **/

function addAddToMainPagesButton(){
    var added = (selectedUserComponent.meta.id in selectedProject.mainComponents);
    if (added){
        var span = document.createElement('span');
        span.innerHTML = '<button type="button" class="btn btn-default ">' +
            '<span class="glyphicon glyphicon-remove"></span>' +
            '<span> Remove from Main Pages</span>' +
            '</button>';
    }
    else{
        var span = document.createElement('span');
        span.innerHTML = '<button type="button" class="btn btn-default ">' +
            '<span class="glyphicon glyphicon-plus"></span>' +
            '<span> Add to Main Pages</span>' +
            '</button>';
    }
    var addToMainPageButton = span.firstChild;
    addToMainPageButton.id = 'btn-add-main-page';;

    $(addToMainPageButton).data('added', added).css({
        position: 'absolute',
        top:'-45px',
        left:'230px',
    });

    $(addToMainPageButton).on("click", function (e) {
        var added = $(this).data('added');
        var userComponentId = selectedUserComponent.meta.id;
        var name = selectedUserComponent.meta.name;
        if (added){
            // then remove
            $($(this).children().get(0)).removeClass('glyphicon-remove').addClass('glyphicon-plus');
            $($(this).children().get(1)).text(' Add to Main Pages');
            delete selectedProject.mainComponents[userComponentId];
            $("#main-pages-list").find("[data-componentid='" + userComponentId + "']").remove();
            displayUserComponentInListAndSelect(name, userComponentId);
            selectedUserComponent.inMainPages = false;
        } else {
            // then add
            $($(this).children().get(0)).removeClass('glyphicon-plus').addClass('glyphicon-remove');
            $($(this).children().get(1)).text(' Remove from Main Pages');

            if (!selectedProject.mainComponents){
                selectedProject.mainComponents = {}; // for safety
            }
            selectedProject.mainComponents[userComponentId] = name;
            $("#user-components-list").find("[data-componentid='" + userComponentId + "']").remove();
            displayMainPageInListAndSelect(name, userComponentId);
            selectedUserComponent.inMainPages = true;
        }
        $(this).data('added', !added);
    });

    $('#main-cell-table').append(addToMainPageButton);

}

/** ** ** Row/Col add/delete and resize functions ** ** ** **/
/**
 *
 * @param ratios {Array}
 */
function resizeRowsBySetRatios(ratios){
    for (var row = 1; row<=numRows; row++){
        for (var col = 1; col<= numCols; col++) {
            selectedUserComponent.layout[row][col].ratio.grid.height = ratios[row-1];
            //selectedUserComponent.layout[row][col].ratio.cell.height = ratios[row-1];
        }
    }
    loadTable(selectedUserComponent);
}


function resizeColsBySetRatios(ratios){
    for (var row = 1; row<=numRows; row++){
        for (var col = 1; col<= numCols; col++) {
            selectedUserComponent.layout[row][col].ratio.grid.width = ratios[col-1];
            //selectedUserComponent.layout[row][col].ratio.cell.width = ratios[col-1];
        }
    }
    loadTable(selectedUserComponent);
}

function addResizeMenu(){
    // TODO
    // will make resize handles invisible until this is opened
    // will also allow resizing by rows and cols by given ratios
    //              this should calculate the last number by itself!
}

function addRowColResizeHandlers(){
    // Have a resizable on the rows
    // once resize is stopped, loop through all the rows/cols, and store the
    // col-width/table-width or col-height/table-height or something similar
    //
    //  Then also set the cell size in load table (or resize function) based on these values

    var onStart = function(){
        start = (new Date).getTime();
        console.log('starting');

        $('.grid').css({
            visibility: 'visible',
            border: 'black 1px dotted',
        });
        $('#drag-handle-containers-container').css({
            visibility: 'hidden',
        });
        $('.cell').css({
            opacity: '.5',
        });
    };

    var onStop = function(){
        $('.grid').css({
            visibility: 'hidden',
            'background-color': 'transparent'
        });
        $('#drag-handle-containers-container').css({
            visibility: 'visible',
        });

        $('.cell').css({
            opacity: '1',
        });
        saveRowColRatiosGrid(!tableLockedWidth, !tableLockedResizeRow);
        hideBaseComponentDisplayAll();
        alignCellsAndGridWithSavedRatios();
        updateBaseComponentDisplayAll();
        showBaseComponentDisplayAll();
        resetAllMergeHandleContainersSizeAndPosition();
        //saveRowColRatiosCells(!tableLockedWidth, !tableLockedResizeRow);
        updateTableResizeHandler();
    };

    //var tableLockedResizeRowFn = function(e, ui){
    //    if ((new Date).getTime() > (start + 5000)){
    //        console.log('hi');
    //    }
    //
    //    var rowNum = getRowColFromId(ui.element.get(0).childNodes[0].id).row;
    //    var newRemainingHeight = gridHeight - 20 - parseFloat(ui.size.height);
    //    var oldRemainingHeight = gridHeight - 20 - parseFloat(ui.originalSize.height);
    //
    //    var sum = 0;
    //
    //    for (var row = 1; row <= numRows; row++) {
    //        if (row != rowNum) {
    //            var oldHeight = (gridHeight - 20)*selectedUserComponent.layout[row][1].ratio.grid.height;
    //            var newHeight = newRemainingHeight*oldHeight/oldRemainingHeight;
    //
    //            sum += newHeight;
    //
    //            $('#guide-grid-container .row_' + row + ' .grid').css({
    //                height: newHeight + "px"
    //            });
    //
    //            $('#guide-grid-container .row_'+row).css({
    //                height: newHeight + "px"
    //            });
    //            //$('#guide-grid-container .row_' + row + ' .ui-resizable-s').css({
    //            //    width: '5px',
    //            //    height: newHeight + "px",
    //            //});
    //        }
    //    }
    //
    //    console.log(sum/newRemainingHeight);
    //    checkHeightRatio(1);
    //};
    //

    var tableLockedResizeRowFn = function(e, ui){
        var rowNum = parseInt(getRowColFromId(ui.element.get(0).childNodes[0].id).row);
        var nextRowNum = rowNum + 1; // having the last handle disabled means that there should always be a next col

        var totalHeight = (gridHeight - 20)*(selectedUserComponent.layout[rowNum][1].ratio.grid.height + selectedUserComponent.layout[nextRowNum][1].ratio.grid.height);
        var remainingHeight = totalHeight - ui.size.height;

        $('#guide-grid-container .row_' + rowNum).resizable('option', 'maxHeight', totalHeight - 10);


        $('#guide-grid-container .row_' + nextRowNum + ' .grid').css({
            height: remainingHeight + "px"
        });

        $('#guide-grid-container .row_'+nextRowNum).css({
            height: remainingHeight + "px"
        });
    };

    //var tableLockedResizeColFn = function(e, ui){
    //    if ((new Date).getTime() > (start + 5000)){
    //        console.log('hey');
    //    }
    //
    //    //var widthSum = getWidthSumGrid();
    //
    //    var colNum = getRowColFromId(ui.element.get(0).id).col;
    //    //var newRemainingWidth = gridWidth - 20 - (parseFloat(ui.size.width)); // there seems to be some weird descrepency between
    //    //var oldRemainingWidth = gridWidth - 20 - (parseFloat(ui.originalSize.width)); // the reported widths and the actual widths!
    //
    //    var newRemainingWidth = gridWidth - 20 - parseFloat($('#grid_1_'+colNum).css('width'));
    //    var oldRemainingWidth = (gridWidth - 20)*(1-selectedUserComponent.layout[1][colNum].ratio.grid.width); // using row 0 because there is no worry of it being merged
    //
    //    var sum = 0;
    //    for (var col = 1; col <= numCols; col++) {
    //        if (col != colNum) {
    //            var oldWidth = (gridWidth - 20)*selectedUserComponent.layout[1][col].ratio.grid.width;
    //            var newWidth = newRemainingWidth*oldWidth/oldRemainingWidth;
    //            newWidth = Math.max(newWidth, 10); // because cells can't get smaller than that
    //            //newWidth = Math.min(newWidth, newRemainingWidth - (numCols-2)*10);
    //
    //            sum += newWidth;
    //            $('#guide-grid-container .col_'+col).css({
    //                width: newWidth + "px"
    //            });
    //        }
    //
    //    }
    //
    //    var newWidth = gridWidth-20-sum;
    //
    //    //$('#guide-grid-container .col_'+colNum).css('width', newWidth+'px');
    //
    //    console.log(sum/newRemainingWidth);
    //};

    var tableLockedResizeColFn = function(e, ui){
        var colNum = parseInt(getRowColFromId(ui.element.get(0).id).col);
        var nextColNum = colNum + 1; // having the last handle disabled means that there should always be a next col

        var totalWidth = (gridWidth - 20)*(selectedUserComponent.layout[1][colNum].ratio.grid.width + selectedUserComponent.layout[1][nextColNum].ratio.grid.width);
        var remainingWidth = totalWidth - parseFloat($('#grid_1_'+colNum).css('width'));

        $('#grid_1_'+colNum).resizable('option', 'maxWidth', totalWidth-10);

        $('#guide-grid-container .col_'+nextColNum).css({
            width: remainingWidth + "px"
        });


    };




    for (var row = 1; row <= numRows; row++) {
        var handle = document.createElement('span');
        handle.innerHTML = '<span class="glyphicon glyphicon-resize-vertical"></span>';
        handle.className = 'ui-resizable-handle ui-resizable-s';
        handle.id = 'ui-resizable-s-row_'+row;

        $(handle).css({
            position: 'absolute',
            top: 'auto',
            bottom: '10px',
            left: '-10px',
            width: 0,
            height: 0,
            cursor: 'ns-resize',
            visibility: 'visible',
            'pointer-events': 'auto',
        });

        $('#grid_'+row+'_1').append(handle);

        $('#guide-grid-container .row_' + row).resizable({
            handles: {'s': handle},
            alsoResize: //'#table-container .row_' + row + ' .cell, ' +  // also resize the td's
                            '#guide-grid-container .row_' + row + ' .grid,' + // also resize the td's
                            ' #guide-grid-container .row_' + row +
                            //', ' +
                          //  '#drag-handle-containers-container .row_' + row + ', ' +
                            //'#table-container .row_' + row + ' .ui-resizable-s' +
                            //' .ui-resizable-s-row_'+row +
                            '',

            start: onStart,
            resize: function(e, ui){
                if (tableLockedResizeRow){
                    tableLockedResizeRowFn(e, ui);
                }
            },
            stop: onStop,
        });


        //
        //var uiResizable = $('#guide-grid-container .row_' + row + ' .ui-resizable-s');
        //
        //uiResizable.addClass('ui-resizable-s-row_'+row).append(handle).css({
        //    //display: 'none',
        //    display: 'table-cell',
        //    cursor: 'ns-resize',
        //    width: '5px',
        //    height: $('#guide-grid-container .row_' + row).css('height'),
        //    position: 'relative',
        //
        //});


    }

    for (var col = 1; col <= numCols; col++) {
        $('#grid_1_' + col).resizable({ //there is always at least 1 cell, and grids can't merge
            handles: 'ew',
            alsoResize: //'#table-container .col_' + col + ',' + // the td's are already resized!
                        '#guide-grid-container .col_' + col // + ', ' +
                        //'#drag-handle-containers-container .col_' + col
            ,
            start : onStart,
            resize: function(e, ui){
                if (tableLockedWidth){
                    tableLockedResizeColFn(e, ui);
                }
            },
            stop: onStop,
        });

        $('#grid_1_' + col + ' .ui-resizable-ew').addClass('glyphicon glyphicon-resize-horizontal').css({
            cursor: 'ew-resize',
            position: 'absolute',
            top: '-15px',
            left: 'auto',
            right: '5px',
            width: '1px',
            height: '1px',
            visibility: 'visible',
            'pointer-events': 'auto',
        });


    }
}

function updateBaseComponentDisplayAll(){
    for (var row = 1; row<=numRows; row++){
        updateBaseComponentDisplayRow(row);
    }
}

function updateBaseComponentDisplayRow(row){
    for (var col = 1; col<=numCols; col++){
        if (selectedUserComponent.components[row]){
            if (selectedUserComponent.components[row][col]){
                var cellId = 'cell'+'_'+row+'_'+col;
                updateBaseComponentDisplayAt(cellId);
            }
        }
    }
}

function updateBaseComponentDisplayCol(col){
    for (var row = 1; row<=numRows; row++){
        if (selectedUserComponent.components[row]){
            if (selectedUserComponent.components[row][col]){
                var cellId = 'cell'+'_'+row+'_'+col;
                updateBaseComponentDisplayAt(cellId);
            }
        }
    }
}


function hideBaseComponentDisplayAll(){
    for (var row = 1; row<=numRows; row++){
        hideBaseComponentDisplayRow(row);
    }
}

function hideBaseComponentDisplayCol(col){
    for (var row = 1; row<=numRows; row++){
        if (selectedUserComponent.components[row]){
            if (selectedUserComponent.components[row][col]){
                var cellId = 'cell'+'_'+row+'_'+col;
                hideBaseComponentDisplayAt(cellId)
            }
        }
    }
}

function hideBaseComponentDisplayRow(row){
    for (var col = 1; col<=numCols; col++){
        if (selectedUserComponent.components[row]){
            if (selectedUserComponent.components[row][col]){
                var cellId = 'cell'+'_'+row+'_'+col;
                hideBaseComponentDisplayAt(cellId)
            }
        }
    }
}



function showBaseComponentDisplayAll(){
    for (var row = 1; row<=numRows; row++){
        showBaseComponentDisplayRow(row);
    }
}

function showBaseComponentDisplayCol(col){
    for (var row = 1; row<=numRows; row++){
        if (selectedUserComponent.components[row]){
            if (selectedUserComponent.components[row][col]){
                var cellId = 'cell'+'_'+row+'_'+col;
                showBaseComponentDisplayAt(cellId)
            }
        }
    }
}

function showBaseComponentDisplayRow(row){
    for (var col = 1; col<=numCols; col++){
        if (selectedUserComponent.components[row]){
            if (selectedUserComponent.components[row][col]){
                var cellId = 'cell'+'_'+row+'_'+col;
                showBaseComponentDisplayAt(cellId)
            }
        }
    }
}

function updateTableResizeHandler() {
    $('#table-resize-div').css({
        width: $('#main-grid-table').css('width'),
        height: $('#main-grid-table').css('height'),
    });
}

function addTableResizeHandler(){
    var tableResizeDiv = document.createElement('div');
    tableResizeDiv.id = 'table-resize-div';

    var dragHandle = document.createElement('span');

    dragHandle.innerHTML = '<img src="images/drag_handle_se_icon.png" width="15px" height="15px">';
    dragHandle.className = 'ui-resizable-handle ui-resizable-se';
    dragHandle.id = 'table-drag-handle';

    $('#guide-grid-container').append(tableResizeDiv);

    $(tableResizeDiv).append(dragHandle).resizable({
        handles: {
            'se': '#table-drag-handle'
        },
        start: function(){
            $(this).css({
                border: 'black 1px dotted',
            })
        },
        stop: function () {
            $(this).css({
                border: 'none',
            });
            selectedUserComponent.layout.tablePxDimensions.width = parseFloat($('#table-resize-div').css('width'));
            selectedUserComponent.layout.tablePxDimensions.height = parseFloat($('#table-resize-div').css('height'));
            gridWidth = selectedUserComponent.layout.tablePxDimensions.width;
            gridHeight = selectedUserComponent.layout.tablePxDimensions.height;

            loadTable(selectedUserComponent);
        }
    }).css({
        'pointer-events':'none',
        position: 'absolute',
        visibility: 'visible',
        top: 0,
        left: 0,
        width: $('#main-grid-table').css('width'),
        height: $('#main-grid-table').css('height'),
    });

    $('#table-drag-handle').css({
        cursor: 'nwse-resize',
        width: 0,
        height: 0,
        position: 'absolute',
        top: 'auto',
        bottom: 0,
        left: 'auto',
        right: 0,
        'pointer-events': 'auto',
    });

}


function addTableSizeLockUnlockButton(){
    tableLockedWidth = false;
    tableLockedResizeRow = false;

    var span = document.createElement('span');
    span.innerHTML = '<button type="button" class="btn btn-default ">' +
        '<img src="images/unlock_icon.png" width="20px" height="20px">' +
        '</button>';

    var tableSizeLockUnlockButton = span.firstChild;
    tableSizeLockUnlockButton.id = 'btn-table-lock-unlock';
    $(tableSizeLockUnlockButton).data('locked', false).css({
        position: 'absolute',
        top:'-45px',
        right:'-20px'

    });

    $(tableSizeLockUnlockButton).on("click", function (e) {
        var locked = $(this).data('locked');
        if (locked){
            // unlock it
            $(this).find('img').get(0).src = 'images/unlock_icon.png';

            // TODO make these separate
            tableLockedWidth = false;
            tableLockedResizeRow = false;

            for (var col = 1; col <= numCols; col++) {
                $('#grid_1_' + col).resizable('option', 'maxWidth', null);
            }

            for (var row = 1; row <= numRows; row++) {
                $('#guide-grid-container .row_' + row).resizable('option', 'maxHeight', null);
            }


            $( '#grid_1_' + numCols ).resizable( "enable");
            $( '#guide-grid-container .row_' + numRows ).resizable( "enable");

            $('#grid_1_' + numCols + ' .ui-resizable-ew').css('visibility', 'visible');
            $('#ui-resizable-s-row_'+numRows).css('visibility', 'visible');


        } else {
            // lock it
            $(this).find('img').get(0).src = 'images/lock_icon.png';
            tableLockedWidth = true;
            tableLockedResizeRow = true;

            // Disable the last row and column
            $( '#grid_1_' + numCols ).resizable( "disable");
            $( '#guide-grid-container .row_' + numRows ).resizable( "disable" );

            $('#grid_1_' + numCols + ' .ui-resizable-ew').css('visibility', 'hidden');
            $('#ui-resizable-s-row_'+numRows).css('visibility', 'hidden');

        }
        $(this).data('locked', !locked);

    });

    $('#main-cell-table').append(tableSizeLockUnlockButton);

}

//function saveRowColRatiosCells(updateTableHeight, updateTableWidth){
//    // save the new table dimensions
//    if (updateTableHeight) {
//        selectedUserComponent.layout.tablePxDimensions.height = parseFloat($('#main-grid-table').css('height'));
//        gridHeight = selectedUserComponent.layout.tablePxDimensions.height;
//    }
//    if (updateTableWidth) {
//        selectedUserComponent.layout.tablePxDimensions.width = parseFloat($('#main-grid-table').css('width'));
//        gridWidth = selectedUserComponent.layout.tablePxDimensions.width;
//    }
//
//    var widthSum = getWidthSumGrid();
//    var heightSum = getHeightSumGrid();
//
//    for (var row = 1; row<=numRows; row++) {
//        for (var col = 1; col <= numCols; col++) {
//            var cell = $('#cell' + '_' + row + '_' + col);
//            var cellWidth = parseFloat(cell.css('width'));
//            var cellHeight = parseFloat(cell.css('height'));
//            //var widthRatioCell = cellWidth/(gridWidth-20);
//            //var heightRatioCell = cellHeight/(gridHeight-20);
//
//            var widthRatioCell = cellWidth/widthSum;
//            var heightRatioCell = cellHeight/heightSum;
//
//            selectedUserComponent.layout[row][col].ratio.cell.width = widthRatioCell;
//            selectedUserComponent.layout[row][col].ratio.cell.height = heightRatioCell;
//        }
//    }
//
//}

function saveRowColRatiosGrid(updateTableWidth, updateTableHeight) {
    // save the new table dimensions
    if (updateTableHeight) {
        selectedUserComponent.layout.tablePxDimensions.height = parseFloat($('#main-grid-table').css('height'));
        gridHeight = selectedUserComponent.layout.tablePxDimensions.height;
    }
    if (updateTableWidth) {
        selectedUserComponent.layout.tablePxDimensions.width = parseFloat($('#main-grid-table').css('width'));
        gridWidth = selectedUserComponent.layout.tablePxDimensions.width;
    }

    var widthSum = getWidthSumGrid();
    var heightSum = getHeightSumGrid();

    for (var row = 1; row<=numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            var grid = $('#grid' + '_' + row + '_' + col);
            var gridCellWidth = parseFloat(grid.css('width'));
            var gridCellHeight = parseFloat(grid.css('height'));
            var widthRatioGrid = gridCellWidth/(gridWidth-20);
            var heightRatioGrid = gridCellHeight/(gridHeight-20);

            var widthRatioGrid = gridCellWidth/widthSum;
            var heightRatioGrid = gridCellHeight/heightSum;


            selectedUserComponent.layout[row][col].ratio.grid.width = widthRatioGrid;
            selectedUserComponent.layout[row][col].ratio.grid.height = heightRatioGrid;
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
    selectedUserComponent.layout[lastRowNum + 1] = {};

    for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++) {
        selectedUserComponent.layout[lastRowNum + 1][col] = {
            spans:{row:1,col:1},
            merged:{isMerged: false,
                topLeftCellId: '',
                topRightCellId: '',
                bottomLeftCellId: '',
                bottomRightCellId: ''},
            hidden:{isHidden: false, hidingCellId: ''},
            // take the width of the grid-cell to the top (grid-cell, in case the cell is merged)
            ratio:{
                //cell:{width: selectedUserComponent.layout[lastRowNum][col].ratio.grid.width, height: standardCellHeight/(gridHeight-20)},
                    grid:{width: selectedUserComponent.layout[lastRowNum][col].ratio.grid.width, height: standardCellHeight/(gridHeight-20)}}
        }

    }
    
    //selectedUserComponent.recalculateRatios(1,0);
    loadTable(selectedUserComponent);
    //saveRowColRatiosCells(true, true);
    saveRowColRatiosGrid(true, true);
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
    for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++) {
        var isHidden = selectedUserComponent.layout[lastRowNum][col].hidden.isHidden;
        var hidingCellId = selectedUserComponent.layout[lastRowNum][col].hidden.hidingCellId;
        if (isHidden){
            if (!(hidingCellId in cellsNeedingRowspanCut)){
                cellsNeedingRowspanCut[hidingCellId] = '';
                var hcRowcol = getRowColFromId(hidingCellId);
                var hcRow = Number(hcRowcol.row);
                var hcCol = Number(hcRowcol.col);

                var rowspan = selectedUserComponent.layout[hcRow][hcCol].spans.row;
                $('#'+hidingCellId).attr('rowspan', rowspan - 1);
                selectedUserComponent.layout[hcRow][hcCol].spans.row = rowspan - 1;

                var oldBottomRightId = $('#'+hidingCellId).data('merged').bottomRightCellId;
                var oldBottomRightRowcol = getRowColFromId(oldBottomRightId);
                var newBottomRightRow = Number(oldBottomRightRowcol.row)-1;
                var newBottomRightCol = oldBottomRightRowcol.col;
                var newBottomRightId = 'cell'+'_'+ newBottomRightRow + '_' + newBottomRightCol;
                selectedUserComponent.layout[hcRow][hcCol].merged.bottomRightCellId = newBottomRightId;
                $('#'+hidingCellId).data('merged', {isMerged: true, bottomRightCellId: newBottomRightId});
                //var widthheight = calculateMergedCellWidthHeight(hidingCellId);
                //$('#'+hidingCellId).css({
                //    width: widthheight.width + 'px',
                //    height: widthheight.height+'px'
                //})
                //selectedUserComponent.layout[hcRow][hcCol].ratio.cell = {width: widthheight.width/(gridWidth-20), height: widthheight.height/(gridHeight-20)};

            }
        }
    }

    delete selectedUserComponent.layout[lastRowNum];


    
    //selectedUserComponent.recalculateRatios(-1,0);
    loadTable(selectedUserComponent);
    //saveRowColRatiosCells(true, true);
    saveRowColRatiosGrid(true, true);

}

/**
 * Adds a column to the end
 * Mutates selectedUserComponent
 */
function addColToEnd() {
    var lastColNum = parseInt(selectedUserComponent.dimensions.cols);

    selectedUserComponent.dimensions.cols = lastColNum + 1;
    numCols += 1;

    if (tableLockedWidth){ // if table width constant
        // for the new column, width is 1/newNumCols
        for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
            selectedUserComponent.layout[row][lastColNum + 1] ={
                spans:{row:1,col:1},
                merged:{isMerged: false,
                    topLeftCellId: '',
                    topRightCellId: '',
                    bottomLeftCellId: '',
                    bottomRightCellId: ''},
                hidden:{isHidden: false, hidingCellId: ''},
                // take the height of the grid-cell to the left (grid-cell, in case the cell is merged)
                ratio:{
                    //cell:{width: 1/(lastColNum+1), height: selectedUserComponent.layout[row][lastColNum].ratio.grid.height},
                    grid:{width: 1/(lastColNum+1), height: selectedUserComponent.layout[row][lastColNum].ratio.grid.height}}
            }
        }

        // for all other columns, scale down the widths proportionally
        for (var col = 1; col<= lastColNum; col++){
            for (var row = 1; row<= numRows; row++){
                //selectedUserComponent.layout[row][col].ratio.cell.width = selectedUserComponent.layout[row][col].ratio.cell.width*(1-1/(lastColNum+1));
                selectedUserComponent.layout[row][col].ratio.grid.width = selectedUserComponent.layout[row][col].ratio.grid.width*(1-1/(lastColNum+1));
            }
        }
    } else {
        for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
            selectedUserComponent.layout[row][lastColNum + 1] ={
                spans:{row:1,col:1},
                merged:{isMerged: false,
                    topLeftCellId: '',
                    topRightCellId: '',
                    bottomLeftCellId: '',
                    bottomRightCellId: ''},
                hidden:{isHidden: false, hidingCellId: ''},
                // take the height of the grid-cell to the left (grid-cell, in case the cell is merged)
                ratio:{
                    //cell:{width: standardCellWidth/(gridWidth-20), height: selectedUserComponent.layout[row][lastColNum].ratio.grid.height},
                    grid:{width: standardCellWidth/(gridWidth-20), height: selectedUserComponent.layout[row][lastColNum].ratio.grid.height}}
            }
        }
    }


    
    //selectedUserComponent.recalculateRatios(0,1);
    loadTable(selectedUserComponent);
    //saveRowColRatiosCells(true, true);
    saveRowColRatiosGrid(true, true);
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
    if (tableLockedWidth) {
        // if table width locked, resize the other cells accordingly
        //var ratioToRemoveCell = selectedUserComponent.layout[1][lastColNum].ratio.cell.width;
        var ratioToRemoveGrid = selectedUserComponent.layout[1][lastColNum].ratio.grid.width;

        for (var col = 1; col<= (numCols-1); col++){
            for (var row = 1; row<= numRows; row++){
                //selectedUserComponent.layout[row][col].ratio.cell.width = selectedUserComponent.layout[row][col].ratio.grid.width/(1-ratioToRemoveCell);
                selectedUserComponent.layout[row][col].ratio.grid.width = selectedUserComponent.layout[row][col].ratio.grid.width/(1-ratioToRemoveGrid);
            }
        }
    }


    // for the deleted column (do this whether or not the table width is locked)
    for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
        var isHidden = selectedUserComponent.layout[row][lastColNum].hidden.isHidden;
        var hidingCellId = selectedUserComponent.layout[row][lastColNum].hidden.hidingCellId;
        if (isHidden){
            if (!(hidingCellId in cellsNeedingColspanCut)){
                cellsNeedingColspanCut[hidingCellId] = '';
                var hcRowcol = getRowColFromId(hidingCellId);
                var hcRow = Number(hcRowcol.row);
                var hcCol = Number(hcRowcol.col);

                var colspan = selectedUserComponent.layout[hcRow][hcCol].spans.col;
                $('#'+hidingCellId).attr('colspan', colspan - 1);
                selectedUserComponent.layout[hcRow][hcCol].spans.col = colspan - 1;

                var oldBottomRightId = $('#'+hidingCellId).data('merged').bottomRightCellId;
                var oldBottomRightRowcol = getRowColFromId(oldBottomRightId);
                var newBottomRightRow = oldBottomRightRowcol.row;
                var newBottomRightCol = Number(oldBottomRightRowcol.col)-1;
                var newBottomRightId = 'cell'+'_'+ newBottomRightRow + '_' + newBottomRightCol;
                selectedUserComponent.layout[hcRow][hcCol].merged.bottomRightCellId = newBottomRightId;
                $('#'+hidingCellId).data('merged', {isMerged: true, bottomRightCellId: newBottomRightId});
            }
        }
        delete selectedUserComponent.layout[row][lastColNum];
    }

    // can be done without reloiading the whole table,
    // just delete the column from the view table
    // and save rowcol ratios


    
    loadTable(selectedUserComponent);
    //saveRowColRatiosCells(true, true);
    saveRowColRatiosGrid(true, true);
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

function addDeleteUserComponentButton(userComponentId){
    var spDelete = document.createElement('span');
    spDelete.innerHTML = '<button type="button" class="btn btn-default btn-delete-component">' +
        //'<span>Delete User Component </span>' +
        '<span class="glyphicon glyphicon-trash"></span>' +
        '</button>';

    var buttonDeleteUserComponent = spDelete.firstChild;
    buttonDeleteUserComponent.id = 'btn-delete-component_'+userComponentId;

    $(buttonDeleteUserComponent).on("click", function (e) {
        if (selectedProject.numComponents === 1){
            return; //don't delete the last one TODO is the the right way to go?
        }
        if (confirmOnUserComponentDelete){
            openDeleteUserComponentConfirmDialogue(userComponentId);
        } else {
            deleteUserComponent(userComponentId);
        }
    });

    var listElt;
    if (userComponentId in selectedProject.mainComponents){
        listElt = $("#main-pages-list").find("[data-componentid='" + userComponentId + "']");
    } else {
        listElt = $("#user-components-list").find("[data-componentid='" + userComponentId + "']");
    }

    listElt.append(buttonDeleteUserComponent).hover(
        function(){
            $(this).find('.component-name-container').css({
                width: '70%'
            });
            $(this).find('.btn-delete-component').css({
                display: 'inline-block',
            });
        }, function(){
            $(this).find('.component-name-container').css({
                width: '100%'
            });
            $(this).find('.btn-delete-component').css({
                display: 'none',

            });
        }
    );
}

function deleteUserComponent(userComponentId){
    if (selectedProject.numComponents === 1){
        return; //don't delete the last one TODO is the the right way to go?
    }
    selectedProject.removeComponent(userComponentId);
    if (userComponentId === selectedUserComponent.meta.id){
        var otherIds = Object.keys(selectedProject.components);
        selectedUserComponent = selectedProject.components[otherIds[0]];
        $("#user-components-list").find("[data-componentid='" + otherIds[0] + "']").attr('id', 'selected');
        loadTable(selectedUserComponent);
    }
    $("#user-components-list").find("[data-componentid='" + userComponentId + "']").remove();
    $("#main-pages-list").find("[data-componentid='" + userComponentId + "']").remove();

}

function openDeleteUserComponentConfirmDialogue(userComponentId){
    $('#confirm-delete-userComponent').modal('show');
    $('#delete-userComponent-name').text(selectedProject.components[userComponentId].meta.name);

    $('#delete-userComponent-btn').click(function(){
        deleteUserComponent(userComponentId);

        $('#delete-userComponent-name').text('');
        $('#confirm-delete-userComponent').modal('hide');
    });

    $('#delete-userComponent-cancel-btn').click(function(){
        $('#delete-userComponent-name').text('');
        $('#confirm-delete-userComponent').modal('hide');
    });

    $('#confirm-delete-userComponent .close').click(function(event){
        event.preventDefault();
        $('#delete-userComponent-name').text('');
        $('#confirm-delete-userComponent').modal('hide');
    });
};



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
        name = sanitizeStringOfSpecialChars($('#new-component-name').val());
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
    $('.cell').each(function () {
        var cellId = $(this).attr('id');
        var rowcol = getRowColFromId(cellId);
        var row = Number(rowcol.row) - 1;
        var col = Number(rowcol.col) - 1;
        if ($(this).get(0).getElementsByClassName('draggable').length == 0) {
            bitmapNew[row][col] = 0;
        } else {
            bitmapNew[row][col] = 1;
        }
    });
}


/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/

function copyUserComponent(userComponent){
    return UserComponent.fromString(JSON.stringify(userComponent));
}