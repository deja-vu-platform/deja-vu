// This file mostly has functions that work to make and display
// the table, and functions that work with editing the datatype
// (which is mostly connected to the table)

/** ** ** ** ** Global variables for this file ** ** ** ** ** **/
const DEFAULT_CONTAINER_WIDTH = '3000px';
const DEFAULT_CONTAINER_HEIGHT = '3000px';

var tableLockedHeight = false;
var tableLockedWidth = false;

/** ** ** ** ** ** ** Table Related Functions ** ** ** ** ** ** **/

/**
 * Creates and displays a table based on the component given
 * @param componentToShow
 */
function loadTable(componentToShow) {
    //$('<style>.main-table::after{content:"' + componentToShow.meta.name + '"}</style>').appendTo('head');
    numRows = componentToShow.dimensions.rows;
    numCols = componentToShow.dimensions.cols;

    var componentId = componentToShow.meta.id;

    makeUserEmptyComponentDisplayTable(componentId);

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


    updateBitmap(true);
    registerDraggable();
    registerTooltipBtnHandlers();
}

function loadTableWithLocksSaved(componentToShow){
    var saveTableLockedWidth = tableLockedWidth;
    var saveTableLockedHeight = tableLockedHeight;
    loadTable(componentToShow);
    toggleTableWidthLock(saveTableLockedWidth);
    toggleTableHeightLock(saveTableLockedHeight);
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
 * Disabled by changing the id and class names
 * @param componentId
 */
function disableComponentDOMElements(componentId){
    var tableGridContainer = $('#table-grid-container'+'_'+componentId);
    $(tableGridContainer).addClass('hidden-component');

    $(tableGridContainer).find('*').each(function() {
        var id = this.id;
        if (id.length>0){
            this.id = 'disabled_'+componentId+'_'+this.id;
        }
        var classes = this.className;
        if (classes.length>0){
            classes = classes.split(' ');
            var classNames = '';
            classes.forEach(function(className){
                classNames = classNames + ' ' + 'disabled_'+componentId+'_'+className;
            });
        this.className = classNames;
        }
    });
}


function enableComponentDOMElements(componentId){
    var tableGridContainer = $('#table-grid-container'+'_'+componentId);
    $(tableGridContainer).removeClass('hidden-component');

    $(tableGridContainer).find('*').each(function() {
        var id = this.id;
        if (id.length>0){
            this.id = id.replace('disabled_'+componentId+'_', '');
        }
        var classes = this.className;
        if (classes.length>0){
            classes = classes.split(' ');
            var classNames = '';
            var idx = 0;
            classes.forEach(function(className){
                if (idx = 0){
                    classNames = className.replace('disabled_'+componentId+'_', '');
                } else {
                    classNames =  classNames  + ' ' +  className.replace('disabled_'+componentId+'_', '');
                }
                idx++;
            });
            this.className = classNames;
        }
    });
}

function disableAllComponentDomElementsExcept(componentToEnableId){
    for (var componentId in selectedProject.components){
        if (componentToEnableId == componentId){
            continue;
        }
        if ($('#table-grid-container'+'_'+componentId).hasClass('hidden-component')){
            continue;
        }
        disableComponentDOMElements(componentId);
    }
}

function enableSpecificComponentDomElements(componentToEnableId){
    // first check that the table has been made (otherwise the reset will happen automatically,
    // but more importantly, the table-grid-container won't exist yet
    if (!($('#table-grid-container'+'_'+componentToEnableId).length>0)) {
        createOrResetTableGridContainer(componentToEnableId);
        var state = {
            zoom: 1,
            lock:{
                width: false,
                height: false
            }
        };
        $('#table-grid-container'+'_'+componentToEnableId).data('state', state);
    }

    var componentToEnable = selectedProject.components[componentToEnableId];

    // enable first (toggle needs the id's and classes to be enabled)
    if ($('#table-grid-container'+'_'+componentToEnableId).hasClass('hidden-component')){
        enableComponentDOMElements(componentToEnableId);
    }

    // reset
    numRows = componentToEnable.dimensions.rows;
    numCols = componentToEnable.dimensions.cols;

    updateZoomFromState(componentToEnableId);

    gridWidth = componentToEnable.layout.tablePxDimensions.width * currentZoom;
    gridHeight = componentToEnable.layout.tablePxDimensions.height * currentZoom;


    toggleTableHeightLock($('#table-grid-container'+'_'+componentToEnableId).data('state').lock.height);
    toggleTableWidthLock($('#table-grid-container'+'_'+componentToEnableId).data('state').lock.width);
    updateBitmap(true);
    setComponentOptions(componentToEnable);

}

function makeUserEmptyComponentDisplayTable(componentId){
    disableAllComponentDomElementsExcept(componentId);

    createOrResetTableGridContainer(componentId);
    createTable(componentId);
    createGuideGrid(componentId);
    updateZoomFromState(componentId);
    // Note: this works because we disable all other classes that this affects beforehand
    initialResizeCells();
    attachMergeHandlers(componentId);

    // Note: this works because we disable all other classes that this affects beforehand
    registerDroppable();
    addRowColAddRemoveButtons(componentId);

    // Note: this works because we disable all other classes that this affects beforehand
    addRowColResizeHandlers();

    addTableResizeHandler(componentId);
    addTableSizeLockUnlockButtons(componentId);
    //addClearButtons(componentId);
    //addAddToMainPagesButton();

    setComponentOptions(selectedProject.components[componentId]);


    bitmapOld = make2dArray(numRows, numCols);
    bitmapNew = make2dArray(numRows, numCols);
}

function createOrResetTableGridContainer(componentId){
    if ($('#table-grid-container'+'_'+componentId).length===0){
        var tableGridContainer = document.createElement('div');
        tableGridContainer.id = 'table-grid-container'+'_'+componentId;
        tableGridContainer.className = 'table-grid-container';
        var state = {
            zoom: 1,
            lock:{
                width: false,
                height: false
            }
        };
        $(tableGridContainer).data('state', state);
        $('#outer-container').append(tableGridContainer);

    } else {
        $('#table-grid-container'+'_'+componentId).html('');
    }
};



/**
 * Generate the table
 */
function createTable(componentId) {
    /*
     Note about naming conventions:
     for naming id, try to follow this rule

     name-with-several-parts_idrownumber_idcolnumber

     */

    var tableContainer = document.createElement('div');
    tableContainer.id = 'table-container';

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

    $(tableContainer).append(tableGrid);
    $('#table-grid-container'+'_'+componentId).append(tableContainer);

}

function createGuideGrid(id) {
    var guideGridContainer = document.createElement('div');
    guideGridContainer.id = 'guide-grid-container';

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

    $(guideGridContainer).append(grid);
    $('#table-grid-container'+'_'+id).append(guideGridContainer);

}

function createMergeHandle(row, col){
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
            var componentId = dragHandleContainer.get(0).id;
            var rowcol = getRowColFromId(componentId);
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
            // frame of reference from clientX/Y does not change even if you scroll
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

    return dragHandleContainer;
}


function attachMergeHandlers(componentId) {
    var dragHandleContainersContainer = document.createElement('div');
    dragHandleContainersContainer.id = 'drag-handle-containers-container';

    $('#table-grid-container'+'_'+componentId).append(dragHandleContainersContainer);

    for (var row = 1; row <= numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            var dragHandleContainer = createMergeHandle(row, col);
            $(dragHandleContainersContainer).append(dragHandleContainer);
            resetMergeHandleContainerSizeAndPosition(row, col);
        }
    }


    $('#table-grid-container'+'_'+componentId).on('click', '.cell', function(){
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

    $('#merge-btn').unbind();
    $('#merge-btn').click(function(){
        mergeCells(cell1Id, cell2Id, component);
        $('#confirm-merge').modal('hide');
    });


    $('#merge-cancel-btn').unbind();
    $('#merge-cancel-btn').click(function(){
        resetMergeHandleContainerSizeAndPositionCellId(oldTopLeftCellId);
        $('#confirm-merge').modal('hide');
    });

    $('#confirm-merge .close').unbind();
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

            var width = selectedUserComponent.layout[row][col].ratio.grid.width * (gridWidth);
            var height = selectedUserComponent.layout[row][col].ratio.grid.height * (gridHeight);


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


function updateZoomFromState(componentId){
    currentZoom = $('#table-grid-container'+'_'+componentId).data('state').zoom;
    $('#zoom-control-value').text(Math.round(currentZoom*100)+'%');
    var sliderVal = getSliderValFromZoom(currentZoom);
    $('#zoom-slider').val(sliderVal);

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

    gridWidth = selectedUserComponent.layout.tablePxDimensions.width * currentZoom;
    gridHeight = selectedUserComponent.layout.tablePxDimensions.height * currentZoom;


    cellWidth = ((gridWidth) / numCols);
    cellHeight = ((gridHeight) / numRows);

    resetAligners();

    for (var row = 1; row<=numRows; row++){
        for (var col = 1; col<=numCols; col++){
            //var widthRatioCell = selectedUserComponent.layout[row][col].ratio.cell.width;
            //var heightRatioCell = selectedUserComponent.layout[row][col].ratio.cell.height;
            //var thisCellWidth = widthRatioCell * (gridWidth - 20);
            //var thisCellHeight = heightRatioCell * (gridHeight - 20);


            var widthRatioGrid = selectedUserComponent.layout[row][col].ratio.grid.width;
            var heightRatioGrid = selectedUserComponent.layout[row][col].ratio.grid.height;
            var thisGridCellWidth = widthRatioGrid * (gridWidth);
            var thisGridCellHeight = heightRatioGrid * (gridHeight);

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

    var tooltipWidth = Number($('.tooltip').css('width').substring(0, 3));

    getCSSRule('.tooltip').style.setProperty('left', -1 * Math.floor((tooltipWidth - (cellWidth - 40)) / 2) + 'px', null);

    resizeLabelDivs(cellWidth, cellHeight);
}


function resetAligners() {
    $('#cell_0_0').css({
        width: '1px',
        height: '1px',
    });

    // 0th col
    for (var row = 1; row<=numRows; row++){
        var heightRatioGrid = selectedUserComponent.layout[row][1].ratio.grid.height;
        var thisGridCellHeight = heightRatioGrid * (gridHeight);
        $('#cell' + '_' + row + '_' + 0).css({
            width: '1px',
            height: thisGridCellHeight + 'px',
        })
    }

    // 0th row
    for (var col = 1; col<=numCols; col++) {
        var widthRatioGrid = selectedUserComponent.layout[1][col].ratio.grid.width;
        var thisGridCellWidth = widthRatioGrid * (gridWidth);

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
            var newHeight = selectedUserComponent.layout[row][col].ratio.grid.height * selectedUserComponent.layout.tablePxDimensions.height ;
            $('#grid'+'_'+row+'_'+col).css({
                height: (newHeight)*currentZoom + 'px',
            })

        }
    }
    saveRowColRatiosGrid(true, true);
    propagateCellResizeToOtherElts();

    //loadTable(selectedUserComponent);
}


function resizeColsBySetRatios(ratios){
    for (var row = 1; row<=numRows; row++){
        for (var col = 1; col<= numCols; col++) {
            selectedUserComponent.layout[row][col].ratio.grid.width = ratios[col-1];
            //selectedUserComponent.layout[row][col].ratio.cell.width = ratios[col-1];
            var newWidth = selectedUserComponent.layout[row][col].ratio.grid.width * selectedUserComponent.layout.tablePxDimensions.width;
            $('#grid'+'_'+row+'_'+col).css({
                width: (newWidth)*currentZoom + 'px',
            })

        }
    }
    saveRowColRatiosGrid(true, true);
    propagateCellResizeToOtherElts();
    //loadTable(selectedUserComponent);
}

function propagateCellResizeToOtherElts(){
    hideBaseComponentDisplayAll();
    alignCellsAndGridWithSavedRatios();
    updateBaseComponentDisplayAll();
    showBaseComponentDisplayAll();
    resetAllMergeHandleContainersSizeAndPosition();
    //saveRowColRatiosCells(!tableLockedWidth, !tableLockedHeight);
    updateTableResizeHandler();
}


function rowColResizeOnStart(){

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

function rowColResizeOnStop(){
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
    saveRowColRatiosGrid(!tableLockedWidth, !tableLockedHeight);
    propagateCellResizeToOtherElts();
};

function tableLockedResizeRowFn(e, ui){
    var rowNum = parseInt(getRowColFromId(ui.element.get(0).childNodes[0].id).row);
    var nextRowNum = rowNum + 1; // having the last handle disabled means that there should always be a next col

    var totalHeight = (gridHeight)*(selectedUserComponent.layout[rowNum][1].ratio.grid.height + selectedUserComponent.layout[nextRowNum][1].ratio.grid.height);
    var remainingHeight = totalHeight - ui.size.height;

    $('#guide-grid-container .row_' + rowNum).resizable('option', 'maxHeight', totalHeight - 10);


    $('#guide-grid-container .row_' + nextRowNum + ' .grid').css({
        height: remainingHeight + "px"
    });

    $('#guide-grid-container .row_'+nextRowNum).css({
        height: remainingHeight + "px"
    });
};

function tableLockedResizeColFn(e, ui){
    var colNum = parseInt(getRowColFromId(ui.element.get(0).id).col);
    var nextColNum = colNum + 1; // having the last handle disabled means that there should always be a next col

    var totalWidth = (gridWidth)*(selectedUserComponent.layout[1][colNum].ratio.grid.width + selectedUserComponent.layout[1][nextColNum].ratio.grid.width);
    var remainingWidth = totalWidth - parseFloat($('#grid_1_'+colNum).css('width'));

    $('#grid_1_'+colNum).resizable('option', 'maxWidth', totalWidth-10);

    $('#guide-grid-container .col_'+nextColNum).css({
        width: remainingWidth + "px"
    });
};


function addRowResizeHandler(row){
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

        start: rowColResizeOnStart,
        resize: function(e, ui){
            if (tableLockedHeight){
                tableLockedResizeRowFn(e, ui);
            }
        },
        stop: rowColResizeOnStop,
    });
}

function addColResizeHandler(col){
    $('#grid_1_' + col).resizable({ //there is always at least 1 cell, and grids can't merge
        handles: 'ew',
        alsoResize: //'#table-container .col_' + col + ',' + // the td's are already resized!
        '#guide-grid-container .col_' + col // + ', ' +
        //'#drag-handle-containers-container .col_' + col
        ,
        start : rowColResizeOnStart,
        resize: function(e, ui){
            if (tableLockedWidth){
                tableLockedResizeColFn(e, ui);
            }
        },
        stop: rowColResizeOnStop,
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

function addRowColResizeHandlers(){
    // Have a resizable on the rows
    // once resize is stopped, loop through all the rows/cols, and store the
    // col-width/table-width or col-height/table-height or something similar
    //
    //  Then also set the cell size in load table (or resize function) based on these values



    for (var row = 1; row <= numRows; row++) {
        addRowResizeHandler(row);
    }

    for (var col = 1; col <= numCols; col++) {
        addColResizeHandler(col);
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

function addTableResizeHandler(componentId){
    var tableResizeDiv = document.createElement('div');
    tableResizeDiv.id = 'table-resize-div';

    var dragHandle = document.createElement('span');

    dragHandle.innerHTML = '<img src="images/drag_handle_se_icon.png" width="15px" height="15px">';
    dragHandle.className = 'ui-resizable-handle ui-resizable-se';
    dragHandle.id = 'table-drag-handle';

    $('#table-grid-container'+'_'+componentId+' '+'#guide-grid-container').append(tableResizeDiv);

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
            selectedUserComponent.layout.tablePxDimensions.width = (parseFloat($('#table-resize-div').css('width'))-20)/currentZoom;
            selectedUserComponent.layout.tablePxDimensions.height = (parseFloat($('#table-resize-div').css('height'))-20)/currentZoom;
            resizeTableToZoom();

            // updating this again to fix for rounding errors
            gridWidth = (parseFloat($('#table-resize-div').css('width'))-20);
            gridHeight = (parseFloat($('#table-resize-div').css('height'))-20);
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

/**
 *
 * @param lock {Boolean}
 */
function toggleTableWidthLock(lock){
    tableLockedWidth = lock;
    var state = $('#table-grid-container'+'_'+selectedUserComponent.meta.id).data('state');
    state.lock.width = lock;
    $('#table-grid-container'+'_'+selectedUserComponent.meta.id).data('state', state);

    if (lock){
        // lock it
        $('.btn-table-width-lock-unlock').each(function(){
            $(this).find('img').get(0).src = 'images/lock_icon.png';
        });


        // Disable the last column
        $( '#grid_1_' + numCols ).resizable( "disable");
        $('#grid_1_' + numCols + ' .ui-resizable-ew').css('visibility', 'hidden');

    } else {
        // unlock it
        $('.btn-table-width-lock-unlock').each(function(){
            $(this).find('img').get(0).src = 'images/unlock_icon.png';
        });

        // Enable the last column

        for (var col = 1; col <= numCols; col++) {
            $('#grid_1_' + col).resizable('option', 'maxWidth', null);
        }

        $( '#grid_1_' + numCols ).resizable( "enable");
        $('#grid_1_' + numCols + ' .ui-resizable-ew').css('visibility', 'visible');

    }
}

function toggleTableHeightLock(lock){
    tableLockedHeight = lock;

    var state = $('#table-grid-container'+'_'+selectedUserComponent.meta.id).data('state');
    state.lock.height = lock;
    $('#table-grid-container'+'_'+selectedUserComponent.meta.id).data('state', state);

    if (lock){
        // lock it
        $('.btn-table-height-lock-unlock').each(function(){
            $(this).find('img').get(0).src = 'images/lock_icon.png';
        });

        // Disable the last row
        $( '#guide-grid-container .row_' + numRows ).resizable( "disable" );
        $('#ui-resizable-s-row_'+numRows).css('visibility', 'hidden');

    } else {
        // unlock it
        $('.btn-table-height-lock-unlock').each(function(){
            $(this).find('img').get(0).src = 'images/unlock_icon.png';
        });

        for (var row = 1; row <= numRows; row++) {
            $('#guide-grid-container .row_' + row).resizable('option', 'maxHeight', null);
        }
        $( '#guide-grid-container .row_' + numRows ).resizable( "enable");
        $('#ui-resizable-s-row_'+numRows).css('visibility', 'visible');

    }
}

function addTableSizeLockUnlockButtons(componentId){
    toggleTableWidthLock(false);
    toggleTableHeightLock(false);

    var spanWidth = document.createElement('span');
    spanWidth.innerHTML = '<button type="button" class="btn btn-default ">' +
        '<img src="images/unlock_icon.png" width="20px" height="20px">' +
        '</button>';

    var tableSizeLockUnlockButtonWidth = spanWidth.firstChild;
    $(tableSizeLockUnlockButtonWidth).addClass('btn-table-width-lock-unlock');
    $(tableSizeLockUnlockButtonWidth).css({
        position: 'absolute',
        top:'-45px',
        right:'-20px'

    });



    $(tableSizeLockUnlockButtonWidth).on("click", function (e) {
        var locked = tableLockedWidth;
        if (locked){
            // unlock it
            toggleTableWidthLock(false);

        } else {
            // lock it
            toggleTableWidthLock(true);
        }

    });


    $('.btn-table-width-lock-unlock').each(function(){
        $(this).unbind().on("click", function (e) {
            var locked = tableLockedWidth;
            if (locked){
                // unlock it
                toggleTableWidthLock(false);

            } else {
                // lock it
                toggleTableWidthLock(true);
            }

        });
    })

    var spanHeight = document.createElement('span');
    spanHeight.innerHTML = '<button type="button" class="btn btn-default ">' +
        '<img src="images/unlock_icon.png" width="20px" height="20px">' +
        '</button>';

    var tableSizeLockUnlockButtonHeight = spanHeight.firstChild;
    $(tableSizeLockUnlockButtonHeight).addClass('btn-table-height-lock-unlock');
    $(tableSizeLockUnlockButtonHeight).css({
        position: 'absolute',
        bottom:'-70px',
        left: 0

    });

    $(tableSizeLockUnlockButtonHeight).on("click", function (e) {
        var locked = tableLockedHeight;
        if (locked){
            // unlock it
            toggleTableHeightLock(false);

        } else {
            // lock it
            toggleTableHeightLock(true);
        }

    });


    $('.btn-table-height-lock-unlock').each(function(){
        $(this).unbind().on("click", function (e) {
            var locked = tableLockedHeight;

            if (locked){
                // unlock it
                toggleTableHeightLock(false);

            } else {
                // lock it
                toggleTableHeightLock(true);
            }

        });
    })


    $('#table-grid-container'+'_'+componentId+' '+'#main-cell-table').append(tableSizeLockUnlockButtonWidth);
    $('#table-grid-container'+'_'+componentId+' '+'#main-cell-table').append(tableSizeLockUnlockButtonHeight);

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
        selectedUserComponent.layout.tablePxDimensions.height = (parseFloat($('#main-grid-table').css('height'))-20)/currentZoom;
        gridHeight = (parseFloat($('#main-grid-table').css('height'))-20);
    }
    if (updateTableWidth) {
        selectedUserComponent.layout.tablePxDimensions.width = (parseFloat($('#main-grid-table').css('width'))-20)/currentZoom;
        gridWidth = (parseFloat($('#main-grid-table').css('width'))-20);
    }

    var widthSum = getWidthSumGrid();
    var heightSum = getHeightSumGrid();

    for (var row = 1; row<=numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            var grid = $('#grid' + '_' + row + '_' + col);
            var gridCellWidth = parseFloat(grid.css('width'));
            var gridCellHeight = parseFloat(grid.css('height'));
            var widthRatioGrid = gridCellWidth/(gridWidth);
            var heightRatioGrid = gridCellHeight/(gridHeight);

            var widthRatioGrid = gridCellWidth/widthSum;
            var heightRatioGrid = gridCellHeight/heightSum;


            selectedUserComponent.layout[row][col].ratio.grid.width = widthRatioGrid;
            selectedUserComponent.layout[row][col].ratio.grid.height = heightRatioGrid;
        }
    }

}



function addRowColAddRemoveButtons(componentId){
    var spAddRow = document.createElement('span');
    spAddRow.innerHTML = '<button type="button" class="btn btn-default ">' +
                    '<span class="glyphicon glyphicon-plus"></span>' +
                    '</button>';

    var buttonAddRow = spAddRow.firstChild;
    buttonAddRow.id = 'btn-add-row';

    $(buttonAddRow).on("click", function (e) {
        //addRowToEnd();
        addNRowsToEnd(1);
    });

    var spRemoveRow = document.createElement('span');
    spRemoveRow.innerHTML = '<button type="button" class="btn btn-default ">' +
        '<span class="glyphicon glyphicon-minus"></span>' +
        '</button>';

    var buttonRemoveRow = spRemoveRow.firstChild;
    buttonRemoveRow.id = 'btn-remove-row';

    $(buttonRemoveRow).on("click", function (e) {
        //removeEndRow();
        removeNRowsFromEnd(1);
    });


    var spAddCol = document.createElement('span');
    spAddCol.innerHTML = '<button type="button" class="btn btn-default ">' +
        '<span class="glyphicon glyphicon-plus"></span>' +
        '</button>';

    var buttonAddCol = spAddCol.firstChild;
    buttonAddCol.id = 'btn-add-col';

    $(buttonAddCol).on("click", function (e) {
        //addColToEnd();
        addNColsToEnd(1);
    });

    var spRemoveCol = document.createElement('span');
    spRemoveCol.innerHTML = '<button type="button" class="btn btn-default ">' +
        '<span class="glyphicon glyphicon-minus"></span>' +
        '</button>';

    var buttonRemoveCol = spRemoveCol.firstChild;
    buttonRemoveCol.id = 'btn-remove-col';

    $(buttonRemoveCol).on("click", function (e) {
        //removeEndCol();
        removeNColsFromEnd(1);
    });

    $('#table-grid-container'+'_'+componentId+' '+'#main-cell-table').append(buttonAddRow).append(buttonRemoveRow).append(buttonAddCol).append(buttonRemoveCol);
}

/** ** ** ** Adding and deleting rows and columns **/

function addNRowsToEnd(n) {
    // before anything has changed
    var savedTableLockedHeight = tableLockedHeight;
    toggleTableHeightLock(false);

    var lastRowNum = parseInt(selectedUserComponent.dimensions.rows);
    var newNumRows = lastRowNum + n;

    selectedUserComponent.dimensions.rows = newNumRows;
    numRows = newNumRows;

    if (savedTableLockedHeight) { // if table height constant
        // for the new row, height is 1/newNumRows
        for (var newRow = 1; newRow <= n; newRow++){
            selectedUserComponent.layout[lastRowNum + newRow] = {};
            for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++) {
                selectedUserComponent.layout[lastRowNum + newRow][col] = {
                    spans:{row:1,col:1},
                    merged:{isMerged: false,
                        topLeftCellId: '',
                        topRightCellId: '',
                        bottomLeftCellId: '',
                        bottomRightCellId: ''},
                    hidden:{isHidden: false, hidingCellId: ''},
                    // take the width of the grid-cell to the top (grid-cell, in case the cell is merged)
                    ratio:{
                        grid:{width: selectedUserComponent.layout[lastRowNum][col].ratio.grid.width, height: 1/(newNumRows)}}
                }
            }
        }


        // for all other columns, scale down the widths proportionally = (1 - n/newNumRows)
        for (var row = 1; row <= lastRowNum; row++) {
            for (var col = 1; col <= numCols; col++) {
                selectedUserComponent.layout[row][col].ratio.grid.height = selectedUserComponent.layout[row][col].ratio.grid.height * (1 - n / (newNumRows));
            }
        }
    } else {
        for (var newRow = 1; newRow <= n; newRow++) {
            var newRowNum = lastRowNum + newRow;
            selectedUserComponent.layout[newRowNum] = {};

            for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++) {
                selectedUserComponent.layout[newRowNum][col] = {
                    spans: {row: 1, col: 1},
                    merged: {
                        isMerged: false,
                        topLeftCellId: '',
                        topRightCellId: '',
                        bottomLeftCellId: '',
                        bottomRightCellId: ''
                    },
                    hidden: {isHidden: false, hidingCellId: ''},
                    // take the width of the grid-cell to the top (grid-cell, in case the cell is merged)
                    ratio: {
                        grid: {
                            width: selectedUserComponent.layout[lastRowNum][col].ratio.grid.width,
                            height: standardCellHeight/selectedUserComponent.layout.tablePxDimensions.height
                        }
                    }
                }


            }
        }

    }

    for (var newRow = 1; newRow <= n; newRow++) {
        var newRowNum = lastRowNum + newRow;
        var tableRow = createEmptyRow(newRowNum);
        var gridRow = createEmptyRow(newRowNum);

        for (var col = 0; col <= numCols; col++) {
            if (col === 0) {
                var tableCell = document.createElement('td');
                tableCell.className = 'zero-height zero-width col' + '_' + col;
                tableCell.id = 'cell' + '_' + newRowNum + '_' + col;
            } else {
                var tableCell = createTableCell(newRowNum, col);
                var gridCell = createGridCell(newRowNum, col);
                var dragHandleContainer = createMergeHandle(newRowNum, col);
            }
            tableRow.appendChild(tableCell);
            if (!(col === 0)) {
                gridRow.appendChild(gridCell);
                $('#drag-handle-containers-container').append(dragHandleContainer);
            }
        }

        // it's the selected component, so this shouldn't cause problems
        $('#main-cell-table tr:last').after(tableRow);
        $('#main-grid-table tr:last').after(gridRow);
        //$('#main-cell-table').append(tableRow);
        //$('#main-grid-table').append(gridRow);

    }

    resizeTableToZoom();

    // after the cells have been appended
    for (var newRow = 1; newRow <= n; newRow++) {
        var newRowNum = lastRowNum + newRow;
        addRowResizeHandler(newRowNum);
        for (var col = 0; col <= numCols; col++) {
            resetMergeHandleContainerSizeAndPosition(newRowNum, col);
            registerCellDroppable("cell"+'_'+newRowNum+'_'+col);
        }
    }

    bitmapNew = make2dArray(numRows, numCols);
    updateBitmap();
    bitmapOld = JSON.parse(JSON.stringify(bitmapNew));


    if (!savedTableLockedHeight){
        // if not locked resize the table height accordingly
        // do this after the table has been fitted to the new size
        saveRowColRatiosGrid(true, true);
    }

    toggleTableHeightLock(savedTableLockedHeight);


    //loadTable(selectedUserComponent);
    //if (saveTableLockedHeight){
    //    alignCellsAndGridWithSavedRatios();
    //} else {
    //    saveRowColRatiosGrid(true, true);
    //}
    //// because load table resets this
    //toggleTableWidthLock(saveTableLockedWidth);
    //toggleTableHeightLock(saveTableLockedHeight);

}


/**
 * Adds a row to the end
 * Mutates selectedUserComponent
 */
//function addRowToEnd() {
//    var lastRowNum = parseInt(selectedUserComponent.dimensions.rows);
//
//    selectedUserComponent.dimensions.rows = lastRowNum + 1;
//    numRows += 1;
//    selectedUserComponent.layout[lastRowNum + 1] = {};
//
//    var saveTableLockedWidth = tableLockedWidth;
//    var saveTableLockedHeight = tableLockedHeight;
//
//    if (tableLockedHeight) { // if table height constant
//        // for the new row, width is 1/newNumRows
//        for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++) {
//            selectedUserComponent.layout[lastRowNum + 1][col] = {
//                spans:{row:1,col:1},
//                merged:{isMerged: false,
//                    topLeftCellId: '',
//                    topRightCellId: '',
//                    bottomLeftCellId: '',
//                    bottomRightCellId: ''},
//                hidden:{isHidden: false, hidingCellId: ''},
//                // take the width of the grid-cell to the top (grid-cell, in case the cell is merged)
//                ratio:{
//                    grid:{width: selectedUserComponent.layout[lastRowNum][col].ratio.grid.width, height: 1/(lastRowNum+1)}}
//            }
//        }
//
//        // for all other columns, scale down the widths proportionally
//        for (var row = 1; row <= lastRowNum; row++) {
//            for (var col = 1; col <= numCols; col++) {
//                selectedUserComponent.layout[row][col].ratio.grid.height = selectedUserComponent.layout[row][col].ratio.grid.height * (1 - 1 / (lastRowNum + 1));
//            }
//        }
//    } else {
//
//        for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++) {
//            selectedUserComponent.layout[lastRowNum + 1][col] = {
//                spans:{row:1,col:1},
//                merged:{isMerged: false,
//                    topLeftCellId: '',
//                    topRightCellId: '',
//                    bottomLeftCellId: '',
//                    bottomRightCellId: ''},
//                hidden:{isHidden: false, hidingCellId: ''},
//                // take the width of the grid-cell to the top (grid-cell, in case the cell is merged)
//                ratio:{
//                        grid:{width: selectedUserComponent.layout[lastRowNum][col].ratio.grid.width, height: standardCellHeight/(gridHeight-20)}}
//            }
//        }
//    }
//
//    loadTable(selectedUserComponent);
//    if (saveTableLockedHeight){
//        alignCellsAndGridWithSavedRatios();
//    } else {
//        saveRowColRatiosGrid(true, true);
//    }
//    // because load table resets this
//    toggleTableWidthLock(saveTableLockedWidth);
//    toggleTableHeightLock(saveTableLockedHeight);
//
//}

function removeNRowsFromEnd(n) {
    // before anything has changed
    var savedTableLockedHeight = tableLockedHeight;
    toggleTableHeightLock(false);

    var cellsNeedingRowspanCut = {};

    var lastRowNum = parseInt(selectedUserComponent.dimensions.rows);

    if ((lastRowNum-n) < 1){
        return
    }

    selectedUserComponent.dimensions.rows = lastRowNum - n;
    numRows -= n;


    var ratioToRemoveGrid = 0;
    for (var rowToRemove = 0; rowToRemove < n; rowToRemove++){
        ratioToRemoveGrid += selectedUserComponent.layout[lastRowNum - rowToRemove][1].ratio.grid.height;
    }

    if (savedTableLockedHeight) {
        // if table width locked, resize the other cells accordingly
        for (var row = 1; row<= numRows; row++){
            for (var col = 1; col<= numCols; col++){
                var oldRatio = selectedUserComponent.layout[row][col].ratio.grid.height;
                selectedUserComponent.layout[row][col].ratio.grid.height = oldRatio/(1-ratioToRemoveGrid);
            }
        }
    }

    // for the first deleted row, look for merged cells to fix
    // (do this whether or not the table height is locked)
    for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++) {
        var isHidden = selectedUserComponent.layout[lastRowNum-n+1][col].hidden.isHidden;
        var hidingCellId = selectedUserComponent.layout[lastRowNum-n+1][col].hidden.hidingCellId;
        if (isHidden){
            if (!(hidingCellId in cellsNeedingRowspanCut)){
                cellsNeedingRowspanCut[hidingCellId] = '';
                var hcRowcol = getRowColFromId(hidingCellId);
                var hcRow = Number(hcRowcol.row);
                var hcCol = Number(hcRowcol.col);

                //var rowspan = selectedUserComponent.layout[hcRow][hcCol].spans.row;
                //$('#'+hidingCellId).attr('rowspan', rowspan - 1);
                //selectedUserComponent.layout[hcRow][hcCol].spans.row = rowspan - 1;

                $('#'+hidingCellId).attr('rowspan', lastRowNum-n+1-hcRow);
                selectedUserComponent.layout[hcRow][hcCol].spans.row = lastRowNum-n+1-hcRow;


                var oldBottomRightId = $('#'+hidingCellId).data('merged').bottomRightCellId;
                var oldBottomRightRowcol = getRowColFromId(oldBottomRightId);
                var newBottomRightRow = Number(oldBottomRightRowcol.row)-1;
                var newBottomRightCol = oldBottomRightRowcol.col;
                var newBottomRightId = 'cell'+'_'+ newBottomRightRow + '_' + newBottomRightCol;
                selectedUserComponent.layout[hcRow][hcCol].merged.bottomRightCellId = newBottomRightId;
                $('#'+hidingCellId).data('merged', {isMerged: true, bottomRightCellId: newBottomRightId});
            }
        }
    }

    for (var rowToRemove = 0; rowToRemove < n; rowToRemove++){
        var rowToRemoveNum = lastRowNum - rowToRemove;
        // update datatype
        delete selectedUserComponent.layout[rowToRemoveNum];
        // update view
        $('.row'+'_'+rowToRemoveNum).remove();
        for (var col = 1; col<= numCols; col++){
            $('#drag-handle-container'+'_'+rowToRemoveNum+'_'+col).remove();
        }
    }

    resizeTableToZoom();

    bitmapNew = make2dArray(numRows, numCols);
    updateBitmap();
    bitmapOld = JSON.parse(JSON.stringify(bitmapNew));


    if (!savedTableLockedHeight){
        // if not locked resize the table height accordingly
        // do this after the table has been fitted to the new size
        selectedUserComponent.layout.tablePxDimensions.height = (1-ratioToRemoveGrid)*selectedUserComponent.layout.tablePxDimensions.height
        saveRowColRatiosGrid(false, false);
    }

    toggleTableHeightLock(savedTableLockedHeight);

    //loadTable(selectedUserComponent);
    //if (saveTableLockedHeight){
    //    alignCellsAndGridWithSavedRatios();
    //} else {
    //    saveRowColRatiosGrid(true, true);
    //}
    //// because load table resets this
    //toggleTableWidthLock(saveTableLockedWidth);
    //toggleTableHeightLock(saveTableLockedHeight);

}



/**
 * Removes the end row
 * Does nothing if there is only one row left
 * Mutates selectedUserComponent
// */
//function removeEndRow() {
//    var cellsNeedingRowspanCut = {};
//
//    var lastRowNum = parseInt(selectedUserComponent.dimensions.rows);
//
//    if (lastRowNum == 1){
//        return
//    }
//
//    selectedUserComponent.dimensions.rows = lastRowNum - 1;
//    numRows -= 1;
//
//    var saveTableLockedWidth = tableLockedWidth;
//    var saveTableLockedHeight = tableLockedHeight;
//
//
//    if (tableLockedHeight) {
//        // if table width locked, resize the other cells accordingly
//        //var ratioToRemoveCell = selectedUserComponent.layout[1][lastColNum].ratio.cell.width;
//        var ratioToRemoveGrid = selectedUserComponent.layout[lastRowNum][1].ratio.grid.height;
//
//        for (var row = 1; row<= numRows; row++){
//            for (var col = 1; col<= numCols; col++){
//                var oldRatio = selectedUserComponent.layout[row][col].ratio.grid.height;
//                selectedUserComponent.layout[row][col].ratio.grid.height = oldRatio/(1-ratioToRemoveGrid);
//            }
//        }
//    }
//
//    // for the deleted row (do this whether or not the table height is locked)
//    for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++) {
//        var isHidden = selectedUserComponent.layout[lastRowNum][col].hidden.isHidden;
//        var hidingCellId = selectedUserComponent.layout[lastRowNum][col].hidden.hidingCellId;
//        if (isHidden){
//            if (!(hidingCellId in cellsNeedingRowspanCut)){
//                cellsNeedingRowspanCut[hidingCellId] = '';
//                var hcRowcol = getRowColFromId(hidingCellId);
//                var hcRow = Number(hcRowcol.row);
//                var hcCol = Number(hcRowcol.col);
//
//                var rowspan = selectedUserComponent.layout[hcRow][hcCol].spans.row;
//                $('#'+hidingCellId).attr('rowspan', rowspan - 1);
//                selectedUserComponent.layout[hcRow][hcCol].spans.row = rowspan - 1;
//
//                var oldBottomRightId = $('#'+hidingCellId).data('merged').bottomRightCellId;
//                var oldBottomRightRowcol = getRowColFromId(oldBottomRightId);
//                var newBottomRightRow = Number(oldBottomRightRowcol.row)-1;
//                var newBottomRightCol = oldBottomRightRowcol.col;
//                var newBottomRightId = 'cell'+'_'+ newBottomRightRow + '_' + newBottomRightCol;
//                selectedUserComponent.layout[hcRow][hcCol].merged.bottomRightCellId = newBottomRightId;
//                $('#'+hidingCellId).data('merged', {isMerged: true, bottomRightCellId: newBottomRightId});
//            }
//        }
//    }
//
//    delete selectedUserComponent.layout[lastRowNum];
//
//    loadTable(selectedUserComponent);
//    if (saveTableLockedHeight){
//        alignCellsAndGridWithSavedRatios();
//    } else {
//        saveRowColRatiosGrid(true, true);
//    }
//    // because load table resets this
//    toggleTableWidthLock(saveTableLockedWidth);
//    toggleTableHeightLock(saveTableLockedHeight);
//
//}
//

function addNColsToEnd(n) {
    var savedTableLockedWidth = tableLockedWidth;
    toggleTableWidthLock(false);


    var lastColNum = parseInt(selectedUserComponent.dimensions.cols);
    var newNumCols = lastColNum + n;

    selectedUserComponent.dimensions.cols = newNumCols;
    numCols = newNumCols;

    if (savedTableLockedWidth) { // if table width constant
        // for each new column, width is 1/newNumCols
        for (var newCol = 1; newCol <= n; newCol++){
            for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
                selectedUserComponent.layout[row][lastColNum + newCol] = {
                    spans: {row: 1, col: 1},
                    merged: {
                        isMerged: false,
                        topLeftCellId: '',
                        topRightCellId: '',
                        bottomLeftCellId: '',
                        bottomRightCellId: ''
                    },
                    hidden: {isHidden: false, hidingCellId: ''},
                    // take the height of the grid-cell to the left (grid-cell, in case the cell is merged)
                    ratio: {
                        grid: {
                            width: 1 / newNumCols,
                            height: selectedUserComponent.layout[row][lastColNum].ratio.grid.height
                        }
                    }
                }
            }
        }
        // for all other columns, scale down the widths proportionally = (1 - n/newNumCols)
        for (var col = 1; col <= lastColNum; col++) {
            for (var row = 1; row <= numRows; row++) {
                selectedUserComponent.layout[row][col].ratio.grid.width = selectedUserComponent.layout[row][col].ratio.grid.width * (1 - n / newNumCols);
            }
        }
    } else {
        for (var newCol = 1; newCol <= n; newCol++) {
            for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
                selectedUserComponent.layout[row][lastColNum + newCol] = {
                    spans: {row: 1, col: 1},
                    merged: {
                        isMerged: false,
                        topLeftCellId: '',
                        topRightCellId: '',
                        bottomLeftCellId: '',
                        bottomRightCellId: ''
                    },
                    hidden: {isHidden: false, hidingCellId: ''},
                    // take the height of the grid-cell to the left (grid-cell, in case the cell is merged)
                    ratio: {
                        grid: {
                            width: standardCellWidth / selectedUserComponent.layout.tablePxDimensions.width,
                            height: selectedUserComponent.layout[row][lastColNum].ratio.grid.height
                        }
                    }
                }
            }
        }
    }

    for (var newCol = 1; newCol <= n; newCol++){
        for (var row = 0; row <= selectedUserComponent.dimensions.rows; row++) {
            var newColNum = lastColNum + newCol;
            if (row === 0) {
                var tableCell = document.createElement('td');
                tableCell.className = 'zero-height col' + '_' + newColNum;
                tableCell.id = 'cell' + '_' + row + '_' + newColNum;
            } else {
                var tableCell = createTableCell(row, newColNum);
                var gridCell = createGridCell(row, newColNum);
                var dragHandleContainer = createMergeHandle(row, newColNum);
            }
            $('#main-cell-table .row_'+row).append(tableCell);
            if (!(row === 0)) {
                $('#main-grid-table .row_'+row).append(gridCell);
                $('#drag-handle-containers-container').append(dragHandleContainer);
            }
        }
    }

    resizeTableToZoom();

    // after the cells have been appended
    for (var newCol = 1; newCol <= n; newCol++){
        var newColNum = lastColNum + newCol;
        addColResizeHandler(newColNum);
        for (var row = 0; row <= selectedUserComponent.dimensions.rows; row++) {
            resetMergeHandleContainerSizeAndPosition(row, newColNum);
            registerCellDroppable("cell"+'_'+row+'_'+newColNum);
        }
    }



    //addRowResizeHandler(newRowNum);



    bitmapNew = make2dArray(numRows, numCols);
    updateBitmap();
    bitmapOld = JSON.parse(JSON.stringify(bitmapNew));


    if (!savedTableLockedWidth){
        // if not locked resize the table height accordingly
        // do this after the table has been fitted to the new size
        saveRowColRatiosGrid(true, true);
    }

    toggleTableWidthLock(savedTableLockedWidth);



    //loadTable(selectedUserComponent);
    //
    //if (saveTableLockedWidth){
    //    alignCellsAndGridWithSavedRatios();
    //} else {
    //    saveRowColRatiosGrid(true, true);
    //}
    //
    //// because load table resets this
    //toggleTableWidthLock(saveTableLockedWidth);
    //toggleTableHeightLock(saveTableLockedHeight);
}


/**
 * Adds a column to the end
 * Mutates selectedUserComponent
 */
//function addColToEnd() {
//    var lastColNum = parseInt(selectedUserComponent.dimensions.cols);
//
//    selectedUserComponent.dimensions.cols = lastColNum + 1;
//    numCols += 1;
//
//    var saveTableLockedWidth = tableLockedWidth;
//    var saveTableLockedHeight = tableLockedHeight;
//
//    if (tableLockedWidth) { // if table width constant
//        // for the new column, width is 1/newNumCols
//        for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
//            selectedUserComponent.layout[row][lastColNum + 1] = {
//                spans: {row: 1, col: 1},
//                merged: {
//                    isMerged: false,
//                    topLeftCellId: '',
//                    topRightCellId: '',
//                    bottomLeftCellId: '',
//                    bottomRightCellId: ''
//                },
//                hidden: {isHidden: false, hidingCellId: ''},
//                // take the height of the grid-cell to the left (grid-cell, in case the cell is merged)
//                ratio: {
//                    grid: {
//                        width: 1 / (lastColNum + 1),
//                        height: selectedUserComponent.layout[row][lastColNum].ratio.grid.height
//                    }
//                }
//            }
//        }
//
//        // for all other columns, scale down the widths proportionally
//        for (var col = 1; col <= lastColNum; col++) {
//            for (var row = 1; row <= numRows; row++) {
//                selectedUserComponent.layout[row][col].ratio.grid.width = selectedUserComponent.layout[row][col].ratio.grid.width * (1 - (1 / (lastColNum + 1)));
//            }
//        }
//    } else {
//        for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
//            selectedUserComponent.layout[row][lastColNum + 1] = {
//                spans: {row: 1, col: 1},
//                merged: {
//                    isMerged: false,
//                    topLeftCellId: '',
//                    topRightCellId: '',
//                    bottomLeftCellId: '',
//                    bottomRightCellId: ''
//                },
//                hidden: {isHidden: false, hidingCellId: ''},
//                // take the height of the grid-cell to the left (grid-cell, in case the cell is merged)
//                ratio: {
//                    grid: {
//                        width: standardCellWidth / (gridWidth - 20),
//                        height: selectedUserComponent.layout[row][lastColNum].ratio.grid.height
//                    }
//                }
//            }
//        }
//    }
//    loadTable(selectedUserComponent);
//    if (saveTableLockedWidth){
//        alignCellsAndGridWithSavedRatios();
//    } else {
//        saveRowColRatiosGrid(true, true);
//    }
//
//    // because load table resets this
//    toggleTableWidthLock(saveTableLockedWidth);
//    toggleTableHeightLock(saveTableLockedHeight);
//}


function removeNColsFromEnd(n) {
    // before anything has changed
    var savedTableLockedWidth = tableLockedWidth;
    toggleTableWidthLock(false); // in order to unlock the last col

    var cellsNeedingColspanCut = {};

    var lastColNum = parseInt(selectedUserComponent.dimensions.cols);
    if ((lastColNum-n) < 1){
        return
    }
    selectedUserComponent.dimensions.cols = lastColNum - n;
    numCols -= n;

    var ratioToRemoveGrid = 0;
    for (var colToRemove = 0; colToRemove<n; colToRemove++){
        ratioToRemoveGrid += selectedUserComponent.layout[1][lastColNum-colToRemove].ratio.grid.width;
    }

    if (savedTableLockedWidth) {
        // if table width locked, resize the other cells accordingly
        for (var col = 1; col<= numCols; col++){
            for (var row = 1; row<= numRows; row++){
                var oldRatio = selectedUserComponent.layout[row][col].ratio.grid.width;
                selectedUserComponent.layout[row][col].ratio.grid.width = oldRatio/(1-ratioToRemoveGrid);
            }
        }
    }


    // for the first deleted column, check for merged cells to fix
    // (do this whether or not the table width is locked)
    for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
        var isHidden = selectedUserComponent.layout[row][lastColNum-n+1].hidden.isHidden;
        var hidingCellId = selectedUserComponent.layout[row][lastColNum-n+1].hidden.hidingCellId;
        if (isHidden){
            if (!(hidingCellId in cellsNeedingColspanCut)){
                cellsNeedingColspanCut[hidingCellId] = '';
                var hcRowcol = getRowColFromId(hidingCellId);
                var hcRow = Number(hcRowcol.row);
                var hcCol = Number(hcRowcol.col);

                //var colspan = selectedUserComponent.layout[hcRow][hcCol].spans.col;
                //$('#'+hidingCellId).attr('colspan', colspan - 1);
                //selectedUserComponent.layout[hcRow][hcCol].spans.col = colspan - 1; //lastRowNum-n+1-hcRow

                $('#'+hidingCellId).attr('colspan', lastColNum-n+1-hcCol);
                selectedUserComponent.layout[hcRow][hcCol].spans.col = lastColNum-n+1-hcCol;

                var oldBottomRightId = $('#'+hidingCellId).data('merged').bottomRightCellId;
                var oldBottomRightRowcol = getRowColFromId(oldBottomRightId);
                var newBottomRightRow = oldBottomRightRowcol.row;
                var newBottomRightCol = Number(oldBottomRightRowcol.col)-1;
                var newBottomRightId = 'cell'+'_'+ newBottomRightRow + '_' + newBottomRightCol;
                selectedUserComponent.layout[hcRow][hcCol].merged.bottomRightCellId = newBottomRightId;
                $('#'+hidingCellId).data('merged', {isMerged: true, bottomRightCellId: newBottomRightId});
            }
        }
    }

    // deleting later in case the calculations above need these values to exist
    for (var colToRemove = 0; colToRemove<n; colToRemove++) {
        for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
            var colToRemoveNum = lastColNum-colToRemove;
            // update the datatype
            delete selectedUserComponent.layout[row][colToRemoveNum];
            // update the display
            $('.col'+'_'+colToRemoveNum).remove();
            $('#drag-handle-container'+'_'+row+'_'+colToRemoveNum).remove();
        }
    }
    resizeTableToZoom();

    bitmapNew = make2dArray(numRows, numCols);
    updateBitmap();
    bitmapOld = JSON.parse(JSON.stringify(bitmapNew));


    if (!savedTableLockedWidth) {
        // if not locked resize the table width accordingly
        // do this after the table has been fitted to the new size
        selectedUserComponent.layout.tablePxDimensions.width = (1-ratioToRemoveGrid)*selectedUserComponent.layout.tablePxDimensions.width
        saveRowColRatiosGrid(false, false);
    }

    toggleTableWidthLock(savedTableLockedWidth); // in order to lock last col again

    //loadTable(selectedUserComponent);
    //if (saveTableLockedWidth){
    //    alignCellsAndGridWithSavedRatios();
    //} else {
    //    saveRowColRatiosGrid(true, true);
    //}
    //
    //// because load table resets this
    //toggleTableWidthLock(saveTableLockedWidth);
    //toggleTableHeightLock(saveTableLockedHeight);
}



/**
 * Remove end columns
 * Does nothing if there is only one column left
 * Mutates selectedUserComponent
 */
//function removeEndCol() {
//    var cellsNeedingColspanCut = {};
//
//    var lastColNum = parseInt(selectedUserComponent.dimensions.cols);
//    if (lastColNum == 1){
//        return
//    }
//    selectedUserComponent.dimensions.cols = lastColNum - 1;
//    numCols -= 1;
//
//    var saveTableLockedWidth = tableLockedWidth;
//    var saveTableLockedHeight = tableLockedHeight;
//
//    if (tableLockedWidth) {
//        // if table width locked, resize the other cells accordingly
//        var ratioToRemoveGrid = selectedUserComponent.layout[1][lastColNum].ratio.grid.width;
//
//        for (var col = 1; col<= numCols; col++){
//            for (var row = 1; row<= numRows; row++){
//                var oldRatio = selectedUserComponent.layout[row][col].ratio.grid.width;
//                selectedUserComponent.layout[row][col].ratio.grid.width = oldRatio/(1-ratioToRemoveGrid);
//            }
//        }
//    }
//
//
//    // for the deleted column (do this whether or not the table width is locked)
//    for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
//        var isHidden = selectedUserComponent.layout[row][lastColNum].hidden.isHidden;
//        var hidingCellId = selectedUserComponent.layout[row][lastColNum].hidden.hidingCellId;
//        if (isHidden){
//            if (!(hidingCellId in cellsNeedingColspanCut)){
//                cellsNeedingColspanCut[hidingCellId] = '';
//                var hcRowcol = getRowColFromId(hidingCellId);
//                var hcRow = Number(hcRowcol.row);
//                var hcCol = Number(hcRowcol.col);
//
//                var colspan = selectedUserComponent.layout[hcRow][hcCol].spans.col;
//                $('#'+hidingCellId).attr('colspan', colspan - 1);
//                selectedUserComponent.layout[hcRow][hcCol].spans.col = colspan - 1;
//
//                var oldBottomRightId = $('#'+hidingCellId).data('merged').bottomRightCellId;
//                var oldBottomRightRowcol = getRowColFromId(oldBottomRightId);
//                var newBottomRightRow = oldBottomRightRowcol.row;
//                var newBottomRightCol = Number(oldBottomRightRowcol.col)-1;
//                var newBottomRightId = 'cell'+'_'+ newBottomRightRow + '_' + newBottomRightCol;
//                selectedUserComponent.layout[hcRow][hcCol].merged.bottomRightCellId = newBottomRightId;
//                $('#'+hidingCellId).data('merged', {isMerged: true, bottomRightCellId: newBottomRightId});
//            }
//        }
//    }
//
//    for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
//        // deleting later in case the calculations above need these values to exist
//        delete selectedUserComponent.layout[row][lastColNum];
//    }
//
//    // can be done without reloiading the whole table,
//    // just delete the column from the view table
//    // and save rowcol ratios
//
//
//
//    loadTable(selectedUserComponent);
//    if (saveTableLockedWidth){
//        alignCellsAndGridWithSavedRatios();
//    } else {
//        saveRowColRatiosGrid(true, true);
//    }
//
//    // because load table resets this
//    toggleTableWidthLock(saveTableLockedWidth);
//    toggleTableHeightLock(saveTableLockedHeight);
//}





///**
// * Add buttons to clear a row, a column or the entire table of its components
// */
//function addClearButtons(componentId){
//    addClearAllButton(componentId);
//}
//
//function addClearAllButton(componentId){
//    var spClearAll = document.createElement('span');
//    spClearAll.innerHTML = '<button type="button" class="btn btn-default ">' +
//                                '<span>Clear All </span>' +
//                                '<span class="glyphicon glyphicon-remove"></span>' +
//                            '</button>';
//
//    var buttonClearAll = spClearAll.firstChild;
//    buttonClearAll.id = 'btn-clear-all';
//
//    $(buttonClearAll).on("click", function (e) {
//        clearAll();
//    });
//
//    $('#table-grid-container'+'_'+componentId+' '+'#main-cell-table').append(buttonClearAll);
//    $(buttonClearAll).css({
//        position: 'absolute',
//        top:'-45px',
//        left:'230px'
//    })
//}

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
    if (userComponentId == selectedUserComponent.meta.id){ // strings will also do
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

    $('#delete-userComponent-btn').unbind();
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
        //version = DEFAULT_VERSION;
        //author = DEFAULT_AUTHOR;
    } else {
        name = sanitizeStringOfSpecialChars($('#new-component-name').val());
        //version = $('#component-version').val();
        //author = $('#component-author').val();
    }

    version = selectedProject.meta.version;
    author = selectedProject.meta.author;

    //$('<style>.main-table::after{content:"' + name + '"}</style>').appendTo('head');
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

function updateBitmap(isDifferentComponent) {
    if (isDifferentComponent){
        bitmapOld = make2dArray(numRows, numCols);
        bitmapNew = make2dArray(numRows, numCols);
    } else {
        bitmapOld = JSON.parse(JSON.stringify(bitmapNew));
    }

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

function duplicateUserComponent(userComponent){
    return UserComponent.fromString(JSON.stringify(userComponent));
}



// ------------------------------------------------------------------------
// obsolete
//
////
//function moveCellContentsToDisplayArea(cellId){
//    // warning! can only be used once
//    var cell = $('#'+cellId);
//    if (cell.find('.display-area').length===0){
//        var children = cell.children();
//        var displayArea = document.createElement('div');
//        $(displayArea).addClass('scalable display-area').append(children);
//        cell.append(displayArea);
//    }
//    return
//}
//
//function moveCellContentsToDisplayAreaAndScale(zoom, cellId){
//    moveCellContentsToDisplayArea(cellId);
//    var cell = $('#'+cellId);
//    cell.find('.display-area').css({
//        '-webkit-transform': 'scale('+zoom+','+zoom+')',
//    });
//}
//
//function moveAllCellContentsToDisplayArea(cellId) {
//    for (var row = 1; row<=numRows; row++) {
//        for (var col = 1; col <= numCols; col++) {
//            var cellId = 'cell'+'_'+row+'_'+col;
//            moveCellContentsToDisplayArea(cellId);
//        }
//    }
//}
//
//function scaleCellComponents(zoom, cellId){
//    $('#'+cellId).children().css({
//        '-webkit-transform': 'scale('+zoom+','+zoom+')',
//    })
//}
//
//function scaleAllCellComponents(zoom) {
//    for (var row = 1; row<=numRows; row++) {
//        for (var col = 1; col <= numCols; col++) {
//            var cellId = 'cell'+'_'+row+'_'+col;
//            scaleCellComponents(zoom, cellId);
//        }
//    }
//}
// ------------------------------------------------------------------------