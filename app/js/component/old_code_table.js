/**
 * Created by Shinjini on 10/12/2016.
 */

/** ** ** ** ** ** ** Table Related Functions ** ** ** ** ** ** **/

/**
 * Creates and displays a table based on the component given
 * @param componentToShow
 */
function loadTable(componentToShow, zoom) {
    numRows = componentToShow.dimensions.rows;
    numCols = componentToShow.dimensions.cols;

    var componentId = componentToShow.meta.id;

    makeUserEmptyComponentDisplayTable(componentId, zoom);

    $('.cell').each(function () {
        var cellId = $(this).get(0).id;
        var rowcol = getRowColFromId(cellId);
        var row = rowcol.row;
        var col = rowcol.col;
        if (componentToShow.components[row]) {
            if (componentToShow.components[row][col]) {
                var innerComponent = componentToShow.components[row][col];
                var type = innerComponent.type;
                showConfigOptions(type, cellId);

                $($('.draggable[name=' + type + ']').get(0)).clone().appendTo($('#' + cellId).get(0));

                var padding = selectedUserComponent.components[row][col].padding;
                var properties = selectedUserComponent.components[row][col].properties;

                display(cellId, type, getHTML[type](innerComponent.components[type]), currentZoom, padding, properties);
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
//
// function loadTableWithLocksSaved(componentToShow){
//     var saveTableLockedWidth = tableLockedWidth;
//     var saveTableLockedHeight = tableLockedHeight;
//     loadTable(componentToShow, 1);
//     toggleTableWidthLock(saveTableLockedWidth);
//     toggleTableHeightLock(saveTableLockedHeight);
// }

/** ** ** Cell/Grid/Row/Col creation helpers ** ** ** **/

/**
 * Requires that the row, col in the datatype is already created
 * @param row
 * @param col
 * @returns {Element}
 */
function createTableCell(row, col) {
    var td = document.createElement('td');
    td.className = 'droppable cell containing-cell col' + '_' + col; // the .containing-cell is there to aid finding the
    // containing cell of an inner component (since .cell is overloaded)


    td.id = 'cell' + '_' + row + '_' + col;

    var sp = document.createElement('span');

    sp.innerHTML = '<button class="btn btn-default btn-xs merge-toggle-out merge-toggle merge-toggle' + '_' + row + '_' + col+'" type="button">'+
        '<img src="images/merge_icon.png" width="30px" height="30px" class="icon">' +
        '</button>';

    var btnMergeToggleOut = sp.firstChild;
    btnMergeToggleOut.id = 'merge-toggle-out' + '_' + row + '_' + col;

    sp.innerHTML = '<div class="dropdown inner-component-options-small">'+
        '<button class="btn btn-default dropdown-toggle btn-xs" type="button" data-toggle="dropdown">'+
        '<span class="glyphicon glyphicon-option-vertical"></span></button>'+
        '<ul class="dropdown-menu">'+
        '</ul>'+
        '</div>';

    var optionsDropdown = sp.firstChild;

    var sp = document.createElement('span');

    sp.innerHTML = '<li>' +
        '<a href="#" class="edit-btn">' +
        '<span class="glyphicon glyphicon-pencil"></span>' +
        '</a>' +
        '</li>';


    var buttonEdit = sp.firstChild;
    buttonEdit.id = 'edit-btn' + '_' + row + '_' + col;

    $(buttonEdit).on("click", function (e) {
        var rowcol = getRowColFromId(this.id);
        $('#cell' + '_' + rowcol.row + '_' + rowcol.col).find('.tooltip').addClass('open');
    });

    sp.innerHTML = '<li>' +
        '<a href="#" class="merge-toggle merge-toggle'+ '_' + row + '_' + col+'">' +
        '<img src="images/merge_icon.png" width="30px" height="30px" class="icon">' +
        '</a>' +
        '</li>';

    var buttonEnableMerge = sp.firstChild;
    buttonEnableMerge.id = 'merge-toggle-in' + '_' + row + '_' + col;
    $(td).data('show-merge-handles', false); // hidden at first

    $(buttonEnableMerge).click(function(){
        var rowcol = getRowColFromId(this.id);
        var showMergeHandles = (!$('#cell'+'_'+rowcol.row+'_'+rowcol.col).data('show-merge-handles')); // whether or not to show after a click is
        var row = rowcol.row;
        var col = rowcol.col;
        // the opposite of what it is before the click!
        if (showMergeHandles){
            showMergeHandle(row,col);
            //$('#drag-handle-container'+'_'+row+'_'+col).find('.drag-handle').css({
            //    display: 'inline',
            //});

        } else {
            hideMergeHandle(row,col);
            //$('#drag-handle-container'+'_'+row+'_'+col).find('.drag-handle').css({
            //    display: 'none',
            //});

        }
        // now store the current state
        $('#cell'+'_'+rowcol.row+'_'+rowcol.col).data('show-merge-handles', showMergeHandles);
    });

    $(btnMergeToggleOut).click(function(){
        var rowcol = getRowColFromId(this.id);
        $('#merge-toggle-in'+ '_' + rowcol.row + '_' + rowcol.col).trigger('click'); //TODO bad way of doing this
    });

    sp.innerHTML = '<li>' +
        '<a href="#" class="inner-component-full-options">' +
        '<span class="glyphicon glyphicon-fullscreen"></span>' +
        '</a>' +
        '</li>';

    var buttonFullOptions = sp.firstChild;
    buttonFullOptions.id = 'inner-component-full-options' + '_' + row + '_' + col;

    $(buttonFullOptions).click(function(){
        var rowcol = getRowColFromId(this.id);
        switchToInnerComponentFocusMode(rowcol.row, rowcol.col);
    });

    sp.innerHTML = '<li>' +
        '<a href="#" class="inner-component-trash">' +
        '<span class="glyphicon glyphicon-trash"></span>' +
        '</a>' +
        '</li>';

    var buttonTrash = sp.firstChild;
    buttonTrash.id = 'inner-component-trash' + '_' + row + '_' + col;

    $(buttonTrash).click(function(){
        var rowcol = getRowColFromId(this.id);
        deleteComponentFromUserComponentAndFromView("cell"+ '_' + rowcol.row + '_' + rowcol.col);
    });


    $(optionsDropdown).find('ul').append(buttonEdit).append(buttonEnableMerge).append(buttonFullOptions).append('<li class="divider"></li>').append(buttonTrash);
    td.appendChild(optionsDropdown);
    td.appendChild(btnMergeToggleOut);



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

    var sp = document.createElement('span');
    sp.innerHTML = '<button type="button" class="btn btn-default add-row-btn btn-xs" id="add-row-btn'+'_'+row+'_'+col+'">+</button>';
    var addRowButton = sp.innerHTML;

    sp.innerHTML = '<button type="button" class="btn btn-default remove-row-btn btn-xs" id="remove-row-btn'+'_'+row+'_'+col+'">x</button>';
    var removeRowButton =  sp.innerHTML;

    sp.innerHTML = '<button type="button" class="btn btn-default add-col-btn btn-xs" id="add-col-btn'+'_'+row+'_'+col+'">+</button>';
    var addColButton =  sp.innerHTML;

    sp.innerHTML = '<button type="button" class="btn btn-default remove-col-btn btn-xs" id="remove-col-btn'+'_'+row+'_'+col+'">x</button>';
    var removeColButton = sp.innerHTML;


    var sizeDisplayInner = '<input type="text" class="value" id="size-display-value_'+row+'_'+col+'">'+
        '<select class="select-unit btn-default btn btn-xs" id="size-display-select_'+row+'_'+col+'">'+
        '<option value="px" selected>px</option>'+
        '<option value="%">%</option>'+
        '</select>';
    var sizeDisplayWidth = '<div class="size-display size-display-width input-single neutral" data-dimension="width">' + sizeDisplayInner + '</div>';
    var sizeDisplayHeight = '<div class="size-display size-display-height input-single neutral" data-dimension="height">' + sizeDisplayInner + '</div>';

    if (row == 1){
        $(td).append(sizeDisplayWidth).append(addColButton).append(removeColButton);
    }
    if (col == 1){
        $(td).append(sizeDisplayHeight).append(addRowButton).append(removeRowButton);
    }

    $(td).on('click', '.add-row-btn', function(){
        console.log('clicked');
        addNRows(1, getRowColFromId(this.id).row);
    });

    $(td).on('click', '.remove-row-btn', function(){
        removeNRows(1, getRowColFromId(this.id).row);
    });

    $(td).on('click', '.add-col-btn', function(){
        addNCols(1, getRowColFromId(this.id).col);
    });

    $(td).on('click', '.remove-col-btn', function(){
        removeNCols(1, getRowColFromId(this.id).col);
    });

    $(td).on('change', '.select-unit', function(){
        $('.select-unit').val($(this).val());
        updateSizeValueDisplay(false);
    });

    $(td).on('click', '.value', function(){
        if ($(this).parent().hasClass('input-single')){ // editing only one
            disableAllSizeDisplays();
            $(this).parent().removeClass('neutral').addClass('input-single-editing');
        }
    });

    $(td).on('keypress', '.value', function(){
        if (event.which == 13) {
            var rowcol = getRowColFromId(this.id);
            if ($(this).parent().hasClass('input-single-editing')){
                var value = parseInt($(this).val());
                if (!isNaN(value)){
                    var type = $('#size-display-select_'+rowcol.row+'_'+rowcol.col).val();
                    if (type == 'px'){
                        if ($(this).parent().data('dimension')=='width'){
                            var dimension = selectedUserComponent.layout.tablePxDimensions.width;
                        } else {
                            var dimension = selectedUserComponent.layout.tablePxDimensions.height;
                        }
                        value = value/dimension; // now value is a ratio

                        if ($(this).parent().data('dimension')=='width'){
                            for (var row = 1; row<=numRows; row++){
                                selectedUserComponent.layout[row][rowcol.col].ratio.grid.width = value;
                            }
                        } else {
                            for (var col = 1; col<=numCols; col++){
                                selectedUserComponent.layout[rowcol.row][col].ratio.grid.height = value;
                            }
                        }
                        scaleTableToZoom(); // this resizes the table based on the above changes in size
                        saveTableSizeAndRowColRatiosGrid(true, true); // this resets the saved ratios to the correct ones
                        updateSizeValueDisplay(false);


                    } else {
                        //TODO: need to deal with inner components having a min width!!
                        value = value/100; // now value is a ratio

                        if ($(this).parent().data('dimension')=='width'){
                            var oldRatio = selectedUserComponent.layout[1][rowcol.col].ratio.grid.width;
                            var difference = value - oldRatio; // this difference is what we have to take away from the others
                            var differencePerCol = difference/(numCols-1);

                            for (var row = 1; row <= numRows; row++) {
                                for (var col = 1; col <= numCols; col++) {
                                    if (col == rowcol.col){
                                        selectedUserComponent.layout[row][col].ratio.grid.width = value;
                                    } else { // for all other columns, scale down the widths proportionally
                                        selectedUserComponent.layout[row][col].ratio.grid.width = Math.max(selectedUserComponent.layout[row][col].ratio.grid.width - differencePerCol,  5/selectedUserComponent.layout.tablePxDimensions.width);
                                    }
                                }
                            }
                        } else {
                            var oldRatio = selectedUserComponent.layout[rowcol.row][1].ratio.grid.height;
                            var difference = value - oldRatio; // this difference is what we have to take away from the others
                            var differencePerRow = difference/(numRows-1);

                            for (var row = 1; row <= numRows; row++) {
                                for (var col = 1; col <= numCols; col++) {
                                    if (row == rowcol.row){
                                        selectedUserComponent.layout[row][col].ratio.grid.height = value;
                                    } else { // for all other columns, scale down the heights proportionally
                                        selectedUserComponent.layout[row][col].ratio.grid.height = Math.max(selectedUserComponent.layout[row][col].ratio.grid.height - differencePerRow, 5/selectedUserComponent.layout.tablePxDimensions.height);
                                    }
                                }
                            }

                        }
                        scaleTableToZoom(); // this resizes the table based on the above changes in size
                        saveTableSizeAndRowColRatiosGrid(true, true);
                        updateSizeValueDisplay(false);
                    }

                }
                $(this).parent().removeClass('input-single-editing').addClass('neutral');
                document.activeElement.blur();

            }
            //else { // if we want the value reset
            //   var type = $(this).parent().data('dimension');
            //   if (type == 'width'){
            //       updateSizeValueDisplayAtCol(rowcol.col, false);
            //   } else {
            //       updateSizeValueDisplayAtRow(rowcol.row, false);
            //   }
            //}
        }
    });
    return td;
}


/**
 * Click outside the size displays to hide it
 */
$(document).click(function(event) {
    if(!$(event.target).is('.value')){
        disableAllSizeDisplays();
    }
});

function disableAllSizeDisplays(){
    $('.input-single-editing').each(function() {
        // this exists
        $(this).removeClass('input-single-editing').addClass('neutral');
        var rowcol = getRowColFromId($(this).find('.select-unit').get(0).id);
        var type = $(this).data('dimension');
        if (type == 'width'){
            updateSizeValueDisplayAtCol(rowcol.col, false);
        } else {
            updateSizeValueDisplayAtRow(rowcol.row, false);
        }
    });
}

function createEmptyRow(rowNumber) {
    var tr = document.createElement('tr');
    tr.className = 'row' + '_' + rowNumber;
    return tr;
}




/** ** ** Table, Grid, Merge-Handler Creation Functions ** ** ** **/
//
// /**
//  * Disabled by changing the id and class names
//  * @param componentId
//  */
// function disableComponentDOMElements(componentId){
//     var tableGridContainer = $('#table-grid-container'+'_'+componentId);
//     $(tableGridContainer).addClass('hidden-component');
//
//     $(tableGridContainer).find('*').each(function() {
//         var id = this.id;
//         if (id.length>0){
//             this.id = 'disabled_'+componentId+'_'+this.id;
//         }
//         var classes = this.className;
//         if (classes.length>0){
//             classes = classes.split(' ');
//             var classNames = '';
//             classes.forEach(function(className){
//                 classNames = classNames + ' ' + 'disabled_'+componentId+'_'+className;
//             });
//         this.className = classNames;
//         }
//     });
// }
//
//
//
// function enableComponentDOMElements(componentId){
//     var tableGridContainer = $('#table-grid-container'+'_'+componentId);
//     $(tableGridContainer).removeClass('hidden-component');
//
//     $(tableGridContainer).find('*').each(function() {
//         var id = this.id;
//         if (id.length>0){
//             this.id = id.replace('disabled_'+componentId+'_', '');
//         }
//         var classes = this.className;
//         if (classes.length>0){
//             classes = classes.split(' ');
//             var classNames = '';
//             classes.forEach(function(className){
//                 classNames =  classNames  + ' ' +  className.replace('disabled_'+componentId+'_', '');
//             });
//             this.className = classNames.trim();
//         }
//     });
// }
//
// function disableAllComponentDomElementsExcept(componentToEnableId){
//     for (var componentId in selectedProject.components){
//         if (componentToEnableId == componentId){
//             continue;
//         }
//         if ($('#table-grid-container'+'_'+componentId).hasClass('hidden-component')){
//             continue;
//         }
//         disableComponentDOMElements(componentId);
//     }
// }
//
// function enableSpecificComponentDomElements(componentToEnableId){
//     // first check that the table has been made (otherwise the reset will happen automatically,
//     // but more importantly, the table-grid-container won't exist yet
//     if (!($('#table-grid-container'+'_'+componentToEnableId).length>0)) {
//         createOrResetTableGridContainer(componentToEnableId);
//         var state = {
//             zoom: 1,
//             lock:{
//                 width: false,
//                 height: false
//             }
//         };
//         $('#table-grid-container'+'_'+componentToEnableId).data('state', state);
//     }
//
//     var componentToEnable = selectedProject.components[componentToEnableId];
//
//     // enable first (toggle needs the id's and classes to be enabled)
//     if ($('#table-grid-container'+'_'+componentToEnableId).hasClass('hidden-component')){
//         enableComponentDOMElements(componentToEnableId);
//     }
//
//     // reset
//     numRows = componentToEnable.dimensions.rows;
//     numCols = componentToEnable.dimensions.cols;
//
//     updateZoomFromState(componentToEnableId);
//
//     gridWidth = componentToEnable.layout.tablePxDimensions.width * currentZoom;
//     gridHeight = componentToEnable.layout.tablePxDimensions.height * currentZoom;
//
//
//     toggleTableHeightLock($('#table-grid-container'+'_'+componentToEnableId).data('state').lock.height);
//     toggleTableWidthLock($('#table-grid-container'+'_'+componentToEnableId).data('state').lock.width);
//     updateBitmap(true);
//     setComponentOptions(componentToEnable);
//
// }
//

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



 function makeUserEmptyComponentDisplayTable(componentId, zoom){
     toggleInnerComponentVisibility(true);
     currentZoom = zoom; // set zoom value 100%

     disableAllComponentDomElementsExcept(componentId);

     createOrResetTableGridContainer(componentId);
     createTable(componentId);
     createGuideGrid(componentId);
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

     setComponentOptions(selectedProject.components[componentId]);

     changeZoomDisplays(currentZoom);

     bitmapOld = make2dArray(numRows, numCols);
     bitmapNew = make2dArray(numRows, numCols);
 }


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
            // This cell is the cell that was dragged in the first place (may not end up in the final merge)
            var thisCellId = 'cell' + '_' + row + '_' + col;

            var handleType = $(ui.element).data("ui-resizable").axis;

            // this will be one of the cell id's input into the merge function
            // that is, cell1 will be the DIAGONALLY OPPOSITE cell to the new
            // cell we are merging into
            var cellOppId = thisCellId;
            if ($('#'+thisCellId).data('merged').isMerged){
                switch(handleType){
                    case 'ne':
                        cellOppId = $('#'+thisCellId).data('merged').bottomLeftCellId;
                        break;
                    case 'nw':
                        cellOppId = $('#'+thisCellId).data('merged').bottomRightCellId;
                        break;
                    case 'se':
                        cellOppId = $('#'+thisCellId).data('merged').topLeftCellId;
                        break;
                    case 'sw':
                        cellOppId = $('#'+thisCellId).data('merged').topRightCellId;
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
                    // Note, don't delete selectedUserComponent.components[row][col], since the user might cancel the merge
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
                    if (safeToMerge(cellOppId, newCellId, thisCellId)){
                        // if this is already a merged cell we should unmerge it now
                        // since this cell (a top left cell), may not be in the final merge
                        // so should be brought back to the original form
                        unmergeCells(thisCellId); // without the component; it will get it back if it was its
                        mergeCells(cellOppId, newCellId, component);
                    } else {
                        openMergeConfirmDialogue(thisCellId, cellOppId, newCellId, component);
                    }
                } else {
                    unmergeCells(thisCellId);
                    mergeCells(cellOppId, newCellId, component);
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
 *  MergingCell is the one merging over (ie, it contains the original component)
 * @param cell1Id
 * @param cell2Id
 * @returns {boolean}
 */
function safeToMerge(cell1Id, cell2Id, mergingCellId){
    // first check for top left cell and bottom right cell
    var topBottomLeftRight = getTopRowBottomRowLeftColRightCol(cell1Id, cell2Id);
    var topRowNum = topBottomLeftRight[0];
    var bottomRowNum = topBottomLeftRight[1];

    var leftColNum = topBottomLeftRight[2];
    var rightColNum = topBottomLeftRight[3];

    for (var row = topRowNum; row <= bottomRowNum; row++) {
        for (var col = leftColNum; col <= rightColNum; col++) {
            var cellId = "cell" + '_' + row + '_' + col;
            if (cellId === mergingCellId){
                continue;
            }
            // if the cell is hidden, check if the hiding cell has a component
            var isHidden = $('#'+cellId).data('hidden').isHidden;
            if (isHidden){
                var hidingCellId = $('#'+cellId).data('hidden').hidingCellId;
                if (hidingCellId === mergingCellId){
                    continue;
                }
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
                hideMergeHandle(row,col);

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

        $('#' + topLeftCellId).data('hidden', {isHidden: false, hidingCellId: ''});

        var dragContainer = $('#drag-handle-container' + '_' + topRowNum + '_' + leftColNum);
        dragContainer.css('display', 'block');
    }

    // Do these even if the cell is just merging to itself

    // then put the component in there
    if (component) {
        // add the component to the cell
        if (!selectedUserComponent.components[topRowNum]){
            selectedUserComponent.components[topRowNum] = {};
        }
        selectedUserComponent.components[topRowNum][leftColNum] = component;
        displayComponentInTable(topLeftCellId, false, component);
    } else {
        deleteComponentFromUserComponentAndFromView(topLeftCellId);
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
            hideMergeHandle(row,col);
        }
    }

    if (component) {
        // add the component to the cell
        if (!selectedUserComponent.components[topRowNum]){
            selectedUserComponent.components[topRowNum] = {};
        }
        selectedUserComponent.components[topRowNum][leftColNum] = component;
        displayComponentInTable(topLeftCellId, false, component);
    } else {
        deleteComponentFromUserComponentAndFromView(topLeftCellId);

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

function hideMergeHandle(row, col){
    var cell = $("#cell" + '_' + row + '_' + col);
    var dragHandleContainer = $('#drag-handle-container' + '_' + row + '_' + col);

    dragHandleContainer.find('.drag-handle').css({
        display: 'none',
    });

    cell.data('show-merge-handles', false);
    //cell.css({
    //    'pointer-events':'auto',
    //});
    //
    //
    //if (selectedUserComponent.components[row]){
    //    if (selectedUserComponent.components[row][col]){
    //        cell.find('.merge-toggle-out').css({
    //            display: 'none',
    //            'z-index': 1,
    //            'pointer-events':'auto',
    //        });
    //    }
    //} else {
    //    cell.find('.merge-toggle-out').css({
    //        display: 'inline-block',
    //        'z-index': 1,
    //        'pointer-events':'auto',
    //    });
    //}

}

function showMergeHandle(row,col){
    var cell = $("#cell" + '_' + row + '_' + col);
    var dragHandleContainer = $('#drag-handle-container' + '_' + row + '_' + col);

    dragHandleContainer.find('.drag-handle').css({
        display: 'block',
    });

    cell.data('show-merge-handles', true);
    //cell.css({
    //    'pointer-events':'none',
    //});
    //
    //cell.find('.merge-toggle-out').css({
    //    display: 'inline-block',
    //    'z-index': 100,
    //    'pointer-events':'auto',
    //});

}

function resetAllMergeHandleVisibility() {
    resetAllMergeHandleVisibilityExcept(null, null);
}

function resetAllMergeHandleVisibilityExcept(spRow,spCol) {
    for (var row = 1; row <= numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            if ((row!=spRow) && (col != spCol)){
                hideMergeHandle(row,col);
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

            var width = selectedUserComponent.layout[row][col].ratio.grid.width * selectedUserComponent.layout.tablePxDimensions.width * currentZoom;
            var height = selectedUserComponent.layout[row][col].ratio.grid.height *  selectedUserComponent.layout.tablePxDimensions.height * currentZoom;

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

// function updateZoomFromState(componentId){
//     currentZoom = $('#table-grid-container'+'_'+componentId).data('state').zoom;
//     changeZoomDisplays(currentZoom);
// }

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

            var widthRatioGrid = selectedUserComponent.layout[row][col].ratio.grid.width;
            var heightRatioGrid = selectedUserComponent.layout[row][col].ratio.grid.height;
            var thisGridCellWidth = widthRatioGrid * (gridWidth);
            var thisGridCellHeight = heightRatioGrid * (gridHeight);

            $('#cell' + '_' + row + '_' + col).css({
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

    updateSizeValueDisplay(false);
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


function updateSizeValueDisplayAtRow(row, live){
    var type = $('#grid_'+row+'_1').find('.size-display-height select').val();
    if (type == 'px'){
        if (live){
            var val = parseFloat($('#grid_'+row+'_1').css('height'))/currentZoom;
        } else {
            var val = selectedUserComponent.layout[row][1].ratio.grid.height*selectedUserComponent.layout.tablePxDimensions.height;
        }
        $('#grid_'+row+'_1').find('.size-display-height .value').val(Math.round(val));

    } else {// %
        if (live){
            var val = 100*parseFloat($('#grid_'+row+'_1').css('height'))/($('#main-grid-table').height());
        } else {
            var val = selectedUserComponent.layout[row][1].ratio.grid.height*100;
        }
        $('#grid_'+row+'_1').find('.size-display-height .value').val((val).toFixed(2));

    }

}

function updateSizeValueDisplayAtCol(col, live){
    var type = $('#grid_1'+'_'+col).find('.size-display-width select').val();
    if (type == 'px'){
        if (live){
            var val = parseFloat($('#grid_1_'+col).css('width'))/currentZoom;
        } else {
            var val = selectedUserComponent.layout[1][col].ratio.grid.width*selectedUserComponent.layout.tablePxDimensions.width;
        }
        $('#grid_1'+'_'+col).find('.size-display-width .value').val(Math.round(val));

    } else {// %
        if (live){
            var val = 100*parseFloat($('#grid_1_'+col).css('width'))/($('#main-grid-table').width());
        } else {
            var val = selectedUserComponent.layout[1][col].ratio.grid.width*100;
        }
        $('#grid_1'+'_'+col).find('.size-display-width .value').val((val).toFixed(2));
    }
}

function updateSizeValueDisplay(live){
    for (var row = 1; row<=numRows; row++){
        updateSizeValueDisplayAtRow(row, live);
    }
    for (var col = 1; col<=numCols; col++){
        updateSizeValueDisplayAtCol(col, live);
    }
    if (live){
        $('#resize-table-height').find('input').val($('#main-cell-table').height());
        $('#resize-table-width').find('input').val($('#main-cell-table').width());
    } else {
        $('#resize-table-height').find('input').val(selectedUserComponent.layout.tablePxDimensions.height);
        $('#resize-table-width').find('input').val(selectedUserComponent.layout.tablePxDimensions.width);
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


/** ** ** Row/Col add/delete and resize functions ** ** ** **/
/**
 *
 * @param ratios {Array}
 */
function resizeRowsBySetRatios(ratios){
    var sum = 0;
    for (var row = 1; row<=numRows; row++){
        sum+= ratios[row-1];
    }

    for (var row = 1; row<=numRows; row++){
        for (var col = 1; col<= numCols; col++) {
            selectedUserComponent.layout[row][col].ratio.grid.height = ratios[row-1]/sum;
        }
    }

    propagateRatioChangeToAllElts();

    // update the ratios if they didn't add up to 1
    if (!((sum >= .99) && (sum <= 1.01))){
        saveRowRatiosGrid();
        updateSizeValueDisplay(false);

    }
}


function resizeColsBySetRatios(ratios){
    var sum = 0;
    for (var col = 1; col<= numCols; col++) {
        sum+= ratios[col-1];
    }

    for (var col = 1; col<= numCols; col++) {
        for (var row = 1; row<=numRows; row++){
            selectedUserComponent.layout[row][col].ratio.grid.width = ratios[col-1]/sum;
        }
    }

    propagateRatioChangeToAllElts();

    // update the ratios if they didn't add up to 1
    if (!((sum >= .99) && (sum <= 1.01))){
        saveColRatiosGrid();
        updateSizeValueDisplay(false);

    }
}


//
// function propagateRatioChangeToAllElts(){
//     // update these just in case
//     gridHeight = selectedUserComponent.layout.tablePxDimensions.height*currentZoom;
//     gridWidth = selectedUserComponent.layout.tablePxDimensions.width*currentZoom;
//
//     hideBaseComponentDisplayAll();
//     alignCellsAndGridWithSavedRatios();
//     updateBaseComponentDisplayAll();
//     showBaseComponentDisplayAll();
//     resetAllMergeHandleContainersSizeAndPosition();
//     updateTableResizeHandler();
//     updateSizeValueDisplay(false);
//     updateZoomNavComponentSize();
//
// }


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
    saveTableSizeAndRowColRatiosGrid(!tableLockedWidth, !tableLockedHeight);
    propagateRatioChangeToAllElts();
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


    updateSizeValueDisplayAtCol(rowNum, true);
    updateSizeValueDisplayAtCol(nextRowNum, true);
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

    updateSizeValueDisplayAtCol(colNum, true);
    updateSizeValueDisplayAtCol(nextColNum, true);

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
        alsoResize: '#guide-grid-container .row_' + row + ' .grid,' + // also resize the td's
        ' #guide-grid-container .row_' + row,
        start: rowColResizeOnStart,
        resize: function(e, ui){
            if (tableLockedHeight){
                tableLockedResizeRowFn(e, ui);
            } else {
                var row = getRowColFromId($(this).find('.grid').get(0).id).row;
                updateSizeValueDisplayAtRow(row, true);
            }
        },
        stop: rowColResizeOnStop,
    });
}

function addColResizeHandler(col){
    $('#grid_1_' + col).resizable({ //there is always at least 1 cell, and grids can't merge
        handles: 'ew',
        alsoResize: '#guide-grid-container .col_' + col // the td's are already resized!
        ,
        start : rowColResizeOnStart,
        resize: function(e, ui){
            if (tableLockedWidth){
                tableLockedResizeColFn(e, ui);
            } else {
                var col = getRowColFromId(this.id).col;
                updateSizeValueDisplayAtCol(col, true);
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
                var padding = selectedUserComponent.components[row][col].padding;
                var properties = selectedUserComponent.components[row][col].properties;

                updateBaseComponentDisplayAt(cellId, selectedUserComponent.components[row][col].type, currentZoom, padding, properties);
            }
        }
    }
}

function updateBaseComponentDisplayCol(col){
    for (var row = 1; row<=numRows; row++){
        if (selectedUserComponent.components[row]){
            if (selectedUserComponent.components[row][col]){
                var cellId = 'cell'+'_'+row+'_'+col;
                var padding = selectedUserComponent.components[row][col].padding;
                var properties = selectedUserComponent.components[row][col].properties;

                updateBaseComponentDisplayAt(cellId, selectedUserComponent.components[row][col].type, currentZoom, padding, properties);
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
                hideBaseComponentDisplayAt(cellId, selectedUserComponent.components[row][col].type)
            }
        }
    }
}

function hideBaseComponentDisplayRow(row){
    for (var col = 1; col<=numCols; col++){
        if (selectedUserComponent.components[row]){
            if (selectedUserComponent.components[row][col]){
                var cellId = 'cell'+'_'+row+'_'+col;
                hideBaseComponentDisplayAt(cellId, selectedUserComponent.components[row][col].type)
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
                showBaseComponentDisplayAt(cellId, selectedUserComponent.components[row][col].type)
            }
        }
    }
}

function showBaseComponentDisplayRow(row){
    for (var col = 1; col<=numCols; col++){
        if (selectedUserComponent.components[row]){
            if (selectedUserComponent.components[row][col]){
                var cellId = 'cell'+'_'+row+'_'+col;
                showBaseComponentDisplayAt(cellId, selectedUserComponent.components[row][col].type)
            }
        }
    }
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

function toggleTableLockDisable(disable){
    if (disable){
        $('.btn-table-width-lock-unlock').prop('disabled', true);
        $('.btn-table-height-lock-unlock').prop('disabled', true);

    } else {
        $('.btn-table-width-lock-unlock').prop('disabled', false);
        $('.btn-table-height-lock-unlock').prop('disabled', false);

    }
}

$('body').on('click', '.disabled', function(event) {
    event.preventDefault();
});

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
        top:'0px',
        right:'-88px'

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

function updateSavedTableSizeGrid(updateTableWidth, updateTableHeight) {
    // save the new table dimensions
    if (updateTableHeight) {
        selectedUserComponent.layout.tablePxDimensions.height = $('#main-grid-table').height()/currentZoom;
        gridHeight = $('#main-grid-table').height();
    }
    if (updateTableWidth) {
        selectedUserComponent.layout.tablePxDimensions.width = $('#main-grid-table').width()/currentZoom;
        gridWidth = $('#main-grid-table').width();
    }
}

function saveRowRatiosGrid() {
    var heightSum = getHeightSumGrid();

    for (var row = 1; row<=numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            var grid = $('#grid' + '_' + row + '_' + col);
            var gridCellHeight = parseFloat(grid.css('height'));
            var heightRatioGrid = gridCellHeight/(gridHeight);
            var heightRatioGrid = gridCellHeight/heightSum;
            selectedUserComponent.layout[row][col].ratio.grid.height = heightRatioGrid;
        }
    }
}

function saveColRatiosGrid(){
    var widthSum = getWidthSumGrid();

    for (var row = 1; row<=numRows; row++) {
        for (var col = 1; col <= numCols; col++) {
            var grid = $('#grid' + '_' + row + '_' + col);
            var gridCellWidth = parseFloat(grid.css('width'));
            var widthRatioGrid = gridCellWidth/(gridWidth);
            var widthRatioGrid = gridCellWidth/widthSum;
            selectedUserComponent.layout[row][col].ratio.grid.width = widthRatioGrid;
        }
    }
}

function saveTableSizeAndRowColRatiosGrid(updateTableWidth, updateTableHeight) {
    // save the new table dimensions
    updateSavedTableSizeGrid(updateTableWidth, updateTableHeight);
    saveColRatiosGrid();
    saveRowRatiosGrid()
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

/**
 * Adds n rows to the chosenRowNum
 * Mutates selectedUserComponent
 */
function addNRows(n, chosenRowNum) {
    addNRowsToEnd(n);
    chosenRowNum = Number(chosenRowNum);
    var oldChosenRowLayout = selectedUserComponent.layout[chosenRowNum];
    var newLayout = selectedUserComponent.layout[numRows];

    var cellsNeedingRowspanExtended = {};

    var squeeshed = {};
    // for chosenRowNum - 1 and the chosenRowNum, look for merged cells to fix
    for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++) {
        var isHiddenUp;
        var hidingCellIdUp;
        var isMergedUp;
        var mergedCellIdUp;
        if (chosenRowNum == 1){
            break;
        } else {
            isHiddenUp = selectedUserComponent.layout[chosenRowNum-1][col].hidden.isHidden;
            hidingCellIdUp = selectedUserComponent.layout[chosenRowNum-1][col].hidden.hidingCellId;
            isMergedUp = selectedUserComponent.layout[chosenRowNum-1][col].merged.isMerged;
            mergedCellIdUp = 'cell'+'_'+(chosenRowNum-1)+'_'+col;
        }
        var isHiddenDown = selectedUserComponent.layout[chosenRowNum][col].hidden.isHidden;
        var hidingCellIdDown = selectedUserComponent.layout[chosenRowNum][col].hidden.hidingCellId;

        if ((isHiddenUp && isHiddenDown)||(isMergedUp && isHiddenDown)){
            if ((hidingCellIdDown==hidingCellIdUp)|| mergedCellIdUp == hidingCellIdDown){
                // there is always a hiding cell down
                squeeshed[col] = true;
                if (!(hidingCellIdDown in cellsNeedingRowspanExtended)){
                    cellsNeedingRowspanExtended[hidingCellIdDown] = '';
                    var hcRowcol = getRowColFromId(hidingCellIdDown);
                    var hcRow = Number(hcRowcol.row);
                    var hcCol = Number(hcRowcol.col);
                    var oldRowspan = selectedUserComponent.layout[hcRow][hcCol].spans.row;

                    // note that this cell will not move
                    selectedUserComponent.layout[hcRow][hcCol].spans.row = oldRowspan+n;
                }
            }

        }
    }

    for (var row = numRows-n; row >= chosenRowNum; row--) { // going backwards to prevent dataloss
        selectedUserComponent.components[row+n] = selectedUserComponent.components[row];
        selectedUserComponent.layout[row+n] = selectedUserComponent.layout[row];
        selectedUserComponent.components[row] = {};
        //for (var col = 1; col<=numCols; col++){
        //    $('#cell'+'_'+(row+n)+'_'+col).data($('#cell'+'_'+row+'_'+col).data());
        //}

    }

    // for the new rows
    for (var row = chosenRowNum; row <= chosenRowNum+n-1; row++) { // going backwards to prevent dataloss
        selectedUserComponent.layout[row] = newLayout;
        for (var col = 1; col<=numCols; col++){
            if (squeeshed[col]){
                selectedUserComponent.layout[row][col].hidden = oldChosenRowLayout[col].hidden;
            }
        }
    }

    for (var row=1; row<=numRows; row++){
        for (var col=1; col<=numCols; col++) {
            var cellId = 'cell' + '_' + row + '_' + col;
            var cell = $('#' + cellId);
            var isHidden = selectedUserComponent.layout[row][col].hidden.isHidden;
            var isMerged = selectedUserComponent.layout[row][col].merged.isMerged;
            var rowspan = selectedUserComponent.layout[row][col].spans.row;
            var colspan = selectedUserComponent.layout[row][col].spans.col;

            if (isHidden) {
                cell.css("display", "none");
            } else {
                cell.css("display", "table-cell");
                cell.attr("rowSpan", rowspan);
                cell.attr("colSpan", colspan);
                cell.data('hidden', {isHidden: false, hidingCellId:''});

                if (isMerged){
                    var topLeftCellId = 'cell'+'_'+row+'_'+col;
                    var topRightCellId = 'cell'+'_'+row+'_'+(col+colspan-1);
                    var bottomLeftCellId = 'cell'+'_'+(row+rowspan-1)+'_'+col;
                    var bottomRightCellId = 'cell'+'_'+(row+rowspan-1)+'_'+(col+colspan-1);
                    selectedUserComponent.layout[row][col].merged.topLeftCellId = topLeftCellId;
                    selectedUserComponent.layout[row][col].merged.topRightCellId = topRightCellId;
                    selectedUserComponent.layout[row][col].merged.bottomLeftCellId = bottomLeftCellId;
                    selectedUserComponent.layout[row][col].merged.bottomRightCellId = bottomRightCellId;
                    cell.data('merged', selectedUserComponent.layout[row][col].merged);
                    for (var hiddenCellRow = row; hiddenCellRow <= row+rowspan-1; hiddenCellRow++){
                        for (var hiddenCellCol = col; hiddenCellCol <= col+colspan-1; hiddenCellCol++){
                            if (!(hiddenCellRow==row && hiddenCellCol == col)){
                                var hidden = {
                                    isHidden: true,
                                    hidingCellId : 'cell'+'_'+row+'_'+col
                                };
                                $('#cell'+'_'+hiddenCellRow+'_'+hiddenCellCol).data('hidden', hidden);
                                selectedUserComponent.layout[hiddenCellRow][hiddenCellCol].hidden = hidden;
                            }
                        }
                    }
                } else {
                    var topLeftCellId = '';
                    var topRightCellId = '';
                    var bottomLeftCellId = '';
                    var bottomRightCellId = '';
                    selectedUserComponent.layout[row][col].merged.topLeftCellId = topLeftCellId;
                    selectedUserComponent.layout[row][col].merged.topRightCellId = topRightCellId;
                    selectedUserComponent.layout[row][col].merged.bottomLeftCellId = bottomLeftCellId;
                    selectedUserComponent.layout[row][col].merged.bottomRightCellId = bottomRightCellId;

                    cell.data('merged', selectedUserComponent.layout[row][col].merged);
                }
            }

            if (selectedUserComponent.components[row]) {
                var component = selectedUserComponent.components[row][col];
                if (component) {
                    cell.addClass("dropped");
                    cell.removeClass("droppable");
                    cell.droppable('disable');
                    displayComponentInTable(cellId, null, component);
                }
            } else {
                deleteComponentFromView(cellId);
            }
        }
    }

    propagateRatioChangeToAllElts();

    for (var row = 1; row<=numRows; row++){
        for (var col = 1; col<=numCols; col++){
            var cellId = 'cell'+'_'+row+'_'+col;
            refreshContainerDisplay(cellId, currentZoom);
        }
    }
}


/**
 * Adds n rows to the end
 * Mutates selectedUserComponent
 */
function addNRowsToEnd(n) {
    resetAllMergeHandleVisibility();

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


        // for all other columns, scale down the heights proportionally = (1 - n/newNumRows)
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

    }

    scaleTableToZoom();

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
        selectedUserComponent.layout.tablePxDimensions.height = selectedUserComponent.layout.tablePxDimensions.height + n*standardCellHeight;
        gridHeight = selectedUserComponent.layout.tablePxDimensions.height * currentZoom;

        saveRowRatiosGrid();
    }

    toggleTableHeightLock(savedTableLockedHeight);
    updateZoomNavComponentSize();

}

/**
 * Adds n rows to the chosenRowNum
 * Mutates selectedUserComponent
 */
function removeNRows(n, chosenRowNum) {
    // TODO: still need to deal with merged cells being deleted
    chosenRowNum = Number(chosenRowNum);
    var cellsNeedingRowspanShortened = {};

    var firstLowerRowNotDeletedNum = chosenRowNum + n;
    // for the chosenRowNum check for merged cells to be fixed (merged cells will be fixed later)
    for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++) {
        var isHidden = selectedUserComponent.layout[chosenRowNum][col].hidden.isHidden;
        var hidingCellId = selectedUserComponent.layout[chosenRowNum][col].hidden.hidingCellId;
        if (isHidden){
            if (!(hidingCellId in cellsNeedingRowspanShortened)){
                var hcRowcol = getRowColFromId(hidingCellId);
                var hcRow = Number(hcRowcol.row);
                var hcCol = Number(hcRowcol.col);
                if (hcRow == chosenRowNum){
                    continue; // this will be dealt with later (in the next iteration)
                }
                cellsNeedingRowspanShortened[hidingCellId] = '';

                var layout = selectedUserComponent.layout[hcRow][hcCol];
                var bottomRow = getRowColFromId(layout.merged.bottomRightCellId).row;
                var oldRowspan = layout.spans.row;
                var numOfRowsDeletedFromThisCell = Math.min(bottomRow - chosenRowNum + 1, n);

                // since the rows are going to be flipped
                layout.spans.row = oldRowspan-numOfRowsDeletedFromThisCell;
                selectedUserComponent.layout[hcRow][hcCol] = layout;
            }

        }
    }

    // for chosenRowNum + n (the first row not deleted), look for merged cells to fix
    if (firstLowerRowNotDeletedNum<=numRows){
        for (var col = 1; col <= selectedUserComponent.dimensions.cols; col++) {
            var isHidden = selectedUserComponent.layout[firstLowerRowNotDeletedNum][col].hidden.isHidden;
            var hidingCellId = selectedUserComponent.layout[firstLowerRowNotDeletedNum][col].hidden.hidingCellId;

            if (isHidden){
                if (!(hidingCellId in cellsNeedingRowspanShortened)){
                    cellsNeedingRowspanShortened[hidingCellId] = '';
                    var hcRowcol = getRowColFromId(hidingCellId);
                    var hcRow = Number(hcRowcol.row);
                    var hcCol = Number(hcRowcol.col);
                    var layout = selectedUserComponent.layout[hcRow][hcCol];

                    var oldRowspan = layout.spans.row;
                    var numOfRowsDeletedFromThisCell = firstLowerRowNotDeletedNum - hcRow;

                    layout.spans.row = oldRowspan-numOfRowsDeletedFromThisCell;
                    // since the rows are going to be flipped
                    selectedUserComponent.layout[firstLowerRowNotDeletedNum][hcCol] = layout;
                    selectedUserComponent.components[firstLowerRowNotDeletedNum][hcCol] = selectedUserComponent.components[hcRow][hcCol];
                }
            }
        }
    }


    // flip
    for (var row = firstLowerRowNotDeletedNum; row <= numRows; row++) { // to prevent dataloss
        selectedUserComponent.components[row-n] = selectedUserComponent.components[row];
        selectedUserComponent.layout[row-n] = selectedUserComponent.layout[row];
        //for (var col=1; col<=numCols; col++) {
        //    $('#cell'+'_'+(row-n)+'_'+col).data($('#cell'+'_'+row+'_'+col).data());
        //}

    }

    // for the deleted rows, reset the layout and components
    for (var col=1; col<=numCols; col++){
        delete selectedUserComponent.components[row];
        for (var row=numRows-n+1; row<=numRows; row++) {
            selectedUserComponent.layout[row][col] = {
                spans:{row:1,col:1},
                merged:{isMerged: false,
                    topLeftCellId: '',
                    topRightCellId: '',
                    bottomLeftCellId: '',
                    bottomRightCellId: ''},
                hidden:{isHidden: false, hidingCellId: ''},
                // ratio will be measured in %
                ratio: {cell:{width: 0, height: 0},
                    grid:{width: 1/numCols, height: 1/numRows}}
            };
        }
    }

    for (var row=1; row<=numRows-n; row++){
        for (var col=1; col<=numCols; col++) {
            // at this point, the isHidden, isMerged, and span details are correct
            // cellIds have to be updated, and the data in the elements have to be updated

            var cellId = 'cell' + '_' + row + '_' + col;
            var cell = $('#' + cellId);
            var isHidden = selectedUserComponent.layout[row][col].hidden.isHidden;
            var isMerged = selectedUserComponent.layout[row][col].merged.isMerged;
            var rowspan = selectedUserComponent.layout[row][col].spans.row;
            var colspan = selectedUserComponent.layout[row][col].spans.col;

            if (isHidden) {
                cell.css("display", "none");
            } else {
                cell.css("display", "table-cell");
                cell.attr("rowSpan", rowspan);
                cell.attr("colSpan", colspan);
                cell.data('hidden', {isHidden: false, hidingCellId:''});

                if (isMerged){
                    var topLeftCellId = 'cell'+'_'+row+'_'+col;
                    var topRightCellId = 'cell'+'_'+row+'_'+(col+colspan-1);
                    var bottomLeftCellId = 'cell'+'_'+(row+rowspan-1)+'_'+col;
                    var bottomRightCellId = 'cell'+'_'+(row+rowspan-1)+'_'+(col+colspan-1);
                    selectedUserComponent.layout[row][col].merged.topLeftCellId = topLeftCellId;
                    selectedUserComponent.layout[row][col].merged.topRightCellId = topRightCellId;
                    selectedUserComponent.layout[row][col].merged.bottomLeftCellId = bottomLeftCellId;
                    selectedUserComponent.layout[row][col].merged.bottomRightCellId = bottomRightCellId;

                    cell.data('merged', selectedUserComponent.layout[row][col].merged);
                    for (var hiddenCellRow = row; hiddenCellRow <= row+rowspan-1; hiddenCellRow++){
                        for (var hiddenCellCol = col; hiddenCellCol <= col+colspan-1; hiddenCellCol++){
                            if (!(hiddenCellRow==row && hiddenCellCol == col)){
                                var hidden = {
                                    isHidden: true,
                                    hidingCellId : 'cell'+'_'+row+'_'+col
                                };
                                var merged = {
                                    isMerged: false,
                                    topLeftCellId: '',
                                    toRightCellId: '',
                                    bottomLeftCellId: '',
                                    bottomRightCellId: '',
                                }
                                $('#cell'+'_'+hiddenCellRow+'_'+hiddenCellCol).data('hidden', hidden);
                                selectedUserComponent.layout[hiddenCellRow][hiddenCellCol].hidden = hidden;
                                $('#cell'+'_'+hiddenCellRow+'_'+hiddenCellCol).data('merged', merged);
                                selectedUserComponent.layout[hiddenCellRow][hiddenCellCol].merged = merged;

                            }
                        }
                    }
                } else {
                    var topLeftCellId = '';
                    var topRightCellId = '';
                    var bottomLeftCellId = '';
                    var bottomRightCellId = '';
                    selectedUserComponent.layout[row][col].merged.topLeftCellId = topLeftCellId;
                    selectedUserComponent.layout[row][col].merged.topRightCellId = topRightCellId;
                    selectedUserComponent.layout[row][col].merged.bottomLeftCellId = bottomLeftCellId;
                    selectedUserComponent.layout[row][col].merged.bottomRightCellId = bottomRightCellId;

                    cell.data('merged', selectedUserComponent.layout[row][col].merged);
                }
            }

            if (selectedUserComponent.components[row]) {
                var component = selectedUserComponent.components[row][col];
                if (component) {
                    cell.addClass("dropped");
                    cell.removeClass("droppable");
                    cell.droppable('disable');
                    displayComponentInTable(cellId, null, component);
                }
            } else {
                deleteComponentFromView(cellId);
            }
        }
    }

    propagateRatioChangeToAllElts();
    for (var row = 1; row<=numRows; row++){
        for (var col = 1; col<=numCols; col++){
            var cellId = 'cell'+'_'+row+'_'+col;
            refreshContainerDisplay(cellId, currentZoom);
        }
    }

    removeNRowsFromEnd(n);

}


/**
 * Removes n rows from the end
 * Does nothing if there is only one row left
 * Mutates selectedUserComponent
 */

function removeNRowsFromEnd(n) {
    resetAllMergeHandleVisibility();

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

                var newRowSpan = lastRowNum-n+1-hcRow;
                $('#'+hidingCellId).attr('rowspan', newRowSpan);
                selectedUserComponent.layout[hcRow][hcCol].spans.row = newRowSpan;

                var mergeData = $('#'+hidingCellId).data('merged');
                var oldBottomRightId = mergeData.bottomRightCellId;
                var oldBottomRightRowcol = getRowColFromId(oldBottomRightId);
                var newBottomRightRow = hcRow+newRowSpan-1;
                var newBottomRightCol = oldBottomRightRowcol.col;
                var newBottomRightId = 'cell'+'_'+ newBottomRightRow + '_' + newBottomRightCol;
                var oldBottomLeftId = mergeData.bottomLeftCellId;
                var oldBottomLeftRowcol = getRowColFromId(oldBottomLeftId);
                var newBottomLeftRow = hcRow+newRowSpan-1;
                var newBottomLeftCol = oldBottomLeftRowcol.col;
                var newBottomLeftId = 'cell'+'_'+ newBottomLeftRow + '_' + newBottomLeftCol;


                mergeData.bottomRightCellId = newBottomRightId;
                mergeData.bottomLeftCellId = newBottomLeftId;

                selectedUserComponent.layout[hcRow][hcCol].merged.bottomRightCellId = newBottomRightId;
                $('#'+hidingCellId).data('merged', mergeData);
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

    scaleTableToZoom();

    bitmapNew = make2dArray(numRows, numCols);
    updateBitmap();
    bitmapOld = JSON.parse(JSON.stringify(bitmapNew));


    if (!savedTableLockedHeight){
        // if not locked resize the table height accordingly
        // do this after the table has been fitted to the new size
        selectedUserComponent.layout.tablePxDimensions.height = (1-ratioToRemoveGrid)*selectedUserComponent.layout.tablePxDimensions.height
        gridHeight = selectedUserComponent.layout.tablePxDimensions.height * currentZoom;
        saveRowRatiosGrid();
    }

    toggleTableHeightLock(savedTableLockedHeight);
    updateZoomNavComponentSize();

}


/**
 * Adds n cols to the chosenRowNum
 * Mutates selectedUserComponent
 */
function addNCols(n, chosenColNum) {
    addNColsToEnd(n);
    chosenColNum = Number(chosenColNum);

    var oldChosenColLayout = {};
    var newLayout = {};

    for (var row = 1; row<=numRows; row++){
        oldChosenColLayout[row] = selectedUserComponent.layout[row][chosenColNum];
        newLayout[row] = selectedUserComponent.layout[row][numCols];
    }

    var cellsNeedingColspanExtended = {};
    var squeeshed = {};

    // for chosenColNum - 1 and the chosenColNum, look for merged cells to fix
    for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
        var isHiddenLeft;
        var hidingCellIdLeft;
        var isMergedLeft;
        var mergedCellIdLeft;
        if (chosenColNum == 1){
            break;
        } else {
            isHiddenLeft = selectedUserComponent.layout[row][chosenColNum-1].hidden.isHidden;
            hidingCellIdLeft = selectedUserComponent.layout[row][chosenColNum-1].hidden.hidingCellId;
            isMergedLeft = selectedUserComponent.layout[row][chosenColNum-1].merged.isMerged;
            mergedCellIdLeft = 'cell'+'_'+row+'_'+(chosenColNum-1);
        }

        var isHiddenRight = selectedUserComponent.layout[row][chosenColNum].hidden.isHidden;
        var hidingCellIdRight = selectedUserComponent.layout[row][chosenColNum].hidden.hidingCellId;

        if ((isHiddenLeft && isHiddenRight)||(isMergedLeft&&isHiddenRight)){
            if ((hidingCellIdRight==hidingCellIdLeft)|| mergedCellIdLeft == hidingCellIdRight){
                squeeshed[row] = true;
                // there is always a hiding cell right
                if (!(hidingCellIdRight in cellsNeedingColspanExtended)){
                    cellsNeedingColspanExtended[hidingCellIdRight] = '';
                    var hcRowcol = getRowColFromId(hidingCellIdRight);
                    var hcRow = Number(hcRowcol.row);
                    var hcCol = Number(hcRowcol.col);
                    var oldColspan = selectedUserComponent.layout[hcRow][hcCol].spans.col;

                    // note this cell will not move
                    $('#'+hidingCellIdRight).attr('colspan', oldColspan+n);
                    selectedUserComponent.layout[hcRow][hcCol].spans.col = oldColspan+n;
                }
            }

        }
    }
    for (var row=1; row<=numRows; row++) {
        if (!selectedUserComponent.components[row]){
            selectedUserComponent.components[row]={};
        }
        for (var col = numCols-n; col >= chosenColNum; col--) { // going backwards to prevent dataloss
            selectedUserComponent.components[row][col + n] = selectedUserComponent.components[row][col];
            selectedUserComponent.layout[row][col + n] = selectedUserComponent.layout[row][col];
            delete selectedUserComponent.components[row][col];
            //$('#cell'+'_'+row+'_'+(col+n)).data($('#cell'+'_'+row+'_'+col).data());

        }
    }

    // for the new cols
    for (var col = chosenColNum; col <= chosenColNum+n-1; col++) {
        for (var row = 1; row<=numRows; row++){
            selectedUserComponent.layout[row][col] = newLayout[row];
            if (squeeshed[row]){
                selectedUserComponent.layout[row][col].hidden = oldChosenColLayout[row].hidden;
            }
        }
    }

    for (var row=1; row<=numRows; row++){
        for (var col=1; col<=numCols; col++){
            var cellId = 'cell' + '_' + row + '_' + col;
            var cell = $('#' + cellId);
            var isHidden = selectedUserComponent.layout[row][col].hidden.isHidden;
            var isMerged = selectedUserComponent.layout[row][col].merged.isMerged;
            var rowspan = selectedUserComponent.layout[row][col].spans.row;
            var colspan = selectedUserComponent.layout[row][col].spans.col;

            if (isHidden) {
                cell.css("display", "none");
            } else {
                cell.css("display", "table-cell");
                cell.attr("rowSpan", rowspan);
                cell.attr("colSpan", colspan);
                cell.data('hidden', {isHidden: false, hidingCellId:''});

                if (isMerged){
                    var topLeftCellId = 'cell'+'_'+row+'_'+col;
                    var topRightCellId = 'cell'+'_'+row+'_'+(col+colspan-1);
                    var bottomLeftCellId = 'cell'+'_'+(row+rowspan-1)+'_'+col;
                    var bottomRightCellId = 'cell'+'_'+(row+rowspan-1)+'_'+(col+colspan-1);
                    selectedUserComponent.layout[row][col].merged.topLeftCellId = topLeftCellId;
                    selectedUserComponent.layout[row][col].merged.topRightCellId = topRightCellId;
                    selectedUserComponent.layout[row][col].merged.bottomLeftCellId = bottomLeftCellId;
                    selectedUserComponent.layout[row][col].merged.bottomRightCellId = bottomRightCellId;

                    cell.data('merged', selectedUserComponent.layout[row][col].merged);

                    for (var hiddenCellRow = row; hiddenCellRow <= row+rowspan-1; hiddenCellRow++){
                        for (var hiddenCellCol = col; hiddenCellCol <= col+colspan-1; hiddenCellCol++){
                            if (!(hiddenCellRow==row && hiddenCellCol == col)){
                                var hidden = {
                                    isHidden: true,
                                    hidingCellId : 'cell'+'_'+row+'_'+col
                                };
                                $('#cell'+'_'+hiddenCellRow+'_'+hiddenCellCol).data('hidden', hidden);
                                selectedUserComponent.layout[hiddenCellRow][hiddenCellCol].hidden = hidden;
                            }
                        }
                    }
                } else {
                    var topLeftCellId = '';
                    var topRightCellId = '';
                    var bottomLeftCellId = '';
                    var bottomRightCellId = '';
                    selectedUserComponent.layout[row][col].merged.topLeftCellId = topLeftCellId;
                    selectedUserComponent.layout[row][col].merged.topRightCellId = topRightCellId;
                    selectedUserComponent.layout[row][col].merged.bottomLeftCellId = bottomLeftCellId;
                    selectedUserComponent.layout[row][col].merged.bottomRightCellId = bottomRightCellId;

                    cell.data('merged', selectedUserComponent.layout[row][col].merged);
                }
            }

            if (selectedUserComponent.components[row]) {
                var component = selectedUserComponent.components[row][col];
                if (component) {
                    cell.addClass("dropped");
                    cell.removeClass("droppable");
                    cell.droppable('disable');
                    displayComponentInTable(cellId, null, component);
                }
            } else {
                deleteComponentFromView(cellId);
            }

        }
    }

    propagateRatioChangeToAllElts();
    for (var row = 1; row<=numRows; row++){
        for (var col = 1; col<=numCols; col++){
            var cellId = 'cell'+'_'+row+'_'+col;
            refreshContainerDisplay(cellId, currentZoom);
        }
    }
}



/**
 * Adds n columns to the end
 * Mutates selectedUserComponent
 */

function addNColsToEnd(n) {
    resetAllMergeHandleVisibility();

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

    scaleTableToZoom();

    // after the cells have been appended
    for (var newCol = 1; newCol <= n; newCol++){
        var newColNum = lastColNum + newCol;
        addColResizeHandler(newColNum);
        for (var row = 0; row <= selectedUserComponent.dimensions.rows; row++) {
            resetMergeHandleContainerSizeAndPosition(row, newColNum);
            registerCellDroppable("cell"+'_'+row+'_'+newColNum);
        }
    }


    bitmapNew = make2dArray(numRows, numCols);
    updateBitmap();
    bitmapOld = JSON.parse(JSON.stringify(bitmapNew));


    if (!savedTableLockedWidth){
        // if not locked resize the table height accordingly
        // do this after the table has been fitted to the new size
        selectedUserComponent.layout.tablePxDimensions.width = selectedUserComponent.layout.tablePxDimensions.width + n*standardCellWidth;
        gridWidth = selectedUserComponent.layout.tablePxDimensions.width * currentZoom;
        saveColRatiosGrid();
    }

    toggleTableWidthLock(savedTableLockedWidth);
    updateZoomNavComponentSize();

}


/**
 * Adds n rows to the chosenRowNum
 * Mutates selectedUserComponent
 */
function removeNCols(n, chosenColNum) {

    // TODO: still need to deal with merged cells being deleted

    chosenColNum = Number(chosenColNum);
    var cellsNeedingColspanShortened = {};

    var firstLowerColNotDeletedNum = chosenColNum + n;
    // for the chosenColNum check for merged cells to be fixed (merged cells will be fixed later)
    for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
        var isHidden = selectedUserComponent.layout[row][chosenColNum].hidden.isHidden;
        var hidingCellId = selectedUserComponent.layout[row][chosenColNum].hidden.hidingCellId;

        if (isHidden){
            if (!(hidingCellId in cellsNeedingColspanShortened)){
                var hcRowcol = getRowColFromId(hidingCellId);
                var hcRow = Number(hcRowcol.row);
                var hcCol = Number(hcRowcol.col);
                if (hcCol == chosenColNum){
                    continue; // this will be dealt with later (in the next iteration)
                }
                cellsNeedingColspanShortened[hidingCellId] = '';

                var layout = selectedUserComponent.layout[hcRow][hcCol];

                var rightCol = getRowColFromId(layout.merged.bottomRightCellId).col;

                var oldColspan = layout.spans.col;
                var numOfColsDeletedFromThisCell = Math.min(rightCol - chosenColNum + 1, n);

                // since the rows are going to be flipped
                layout.spans.col = oldColspan-numOfColsDeletedFromThisCell;
                selectedUserComponent.layout[hcRow][hcCol] = layout;
            }

        }
    }



    // for chosenColNum + n (the first col not deleted), look for merged cells to fix
    if (firstLowerColNotDeletedNum<=numCols) {
        for (var row = 1; row <= selectedUserComponent.dimensions.rows; row++) {
            var isHidden = selectedUserComponent.layout[row][firstLowerColNotDeletedNum].hidden.isHidden;
            var hidingCellId = selectedUserComponent.layout[row][firstLowerColNotDeletedNum].hidden.hidingCellId;

            if (isHidden){
                if (!(hidingCellId in cellsNeedingColspanShortened)){

                    cellsNeedingColspanShortened[hidingCellId] = '';
                    var hcRowcol = getRowColFromId(hidingCellId);
                    var hcRow = Number(hcRowcol.row);
                    var hcCol = Number(hcRowcol.col);
                    var layout = selectedUserComponent.layout[hcRow][hcCol];

                    var oldColspan = layout.spans.col;
                    var numOfColsDeletedFromThisCell = firstLowerColNotDeletedNum - hcCol;

                    layout.spans.col = oldColspan-numOfColsDeletedFromThisCell;
                    selectedUserComponent.layout[hcRow][firstLowerColNotDeletedNum] = layout;
                    selectedUserComponent.components[hcRow][firstLowerColNotDeletedNum] = selectedUserComponent.components[hcRow][hcCol];

                }

            }
        }
    }
    // move
    for (var row=1; row<=numRows; row++) {
        if (!selectedUserComponent.components[row]){
            selectedUserComponent.components[row] = {};
        }
        for (var col = chosenColNum; col <= numCols-n; col++) {
            selectedUserComponent.components[row][col] = selectedUserComponent.components[row][col + n];
            selectedUserComponent.layout[row][col] = selectedUserComponent.layout[row][col + n];
            //$('#cell'+'_'+row+'_'+col).data($('#cell'+'_'+row+'_'+(col+n)).data());
        }
    }

    // for the deleted cols, reset the layout and components
    for (var row=1; row<=numRows; row++){
        for (var col=numCols-n+1; col<=numCols; col++) {
            if (selectedUserComponent.components[row]){
                delete selectedUserComponent.components[row][col];
            }
            selectedUserComponent.layout[row][col] = {
                spans:{row:1,col:1},
                merged:{isMerged: false,
                    topLeftCellId: '',
                    topRightCellId: '',
                    bottomLeftCellId: '',
                    bottomRightCellId: ''},
                hidden:{isHidden: false, hidingCellId: ''},
                // ratio will be measured in %
                ratio: {cell:{width: 0, height: 0},
                    grid:{width: 1/numCols, height: 1/numRows}}
            };
        }
    }

    for (var row=1; row<=numRows; row++){
        for (var col=1; col<=numCols-n; col++) {
            // at this point, the isHidden, isMerged, and span details are correct
            // cellIds have to be updated, and the data in the elements have to be updated

            var cellId = 'cell' + '_' + row + '_' + col;
            var cell = $('#' + cellId);
            var isHidden = selectedUserComponent.layout[row][col].hidden.isHidden;
            var isMerged = selectedUserComponent.layout[row][col].merged.isMerged;
            var rowspan = selectedUserComponent.layout[row][col].spans.row;
            var colspan = selectedUserComponent.layout[row][col].spans.col;

            if (isHidden) {
                cell.css("display", "none");
            } else {
                cell.css("display", "table-cell");
                cell.attr("rowSpan", rowspan);
                cell.attr("colSpan", colspan);
                cell.data('hidden', {isHidden: false, hidingCellId:''});

                if (isMerged){
                    var topLeftCellId = 'cell'+'_'+row+'_'+col;
                    var topRightCellId = 'cell'+'_'+row+'_'+(col+colspan-1);
                    var bottomLeftCellId = 'cell'+'_'+(row+rowspan-1)+'_'+col;
                    var bottomRightCellId = 'cell'+'_'+(row+rowspan-1)+'_'+(col+colspan-1);
                    selectedUserComponent.layout[row][col].merged.topLeftCellId = topLeftCellId;
                    selectedUserComponent.layout[row][col].merged.topRightCellId = topRightCellId;
                    selectedUserComponent.layout[row][col].merged.bottomLeftCellId = bottomLeftCellId;
                    selectedUserComponent.layout[row][col].merged.bottomRightCellId = bottomRightCellId;

                    cell.data('merged', selectedUserComponent.layout[row][col].merged);
                    for (var hiddenCellRow = row; hiddenCellRow <= row+rowspan-1; hiddenCellRow++){
                        for (var hiddenCellCol = col; hiddenCellCol <= col+colspan-1; hiddenCellCol++){
                            if (!(hiddenCellRow==row && hiddenCellCol == col)){
                                var hidden = {
                                    isHidden: true,
                                    hidingCellId : 'cell'+'_'+row+'_'+col
                                };
                                var merged = {
                                    isMerged: false,
                                    topLeftCellId: '',
                                    toRightCellId: '',
                                    bottomLeftCellId: '',
                                    bottomRightCellId: '',
                                }
                                $('#cell'+'_'+hiddenCellRow+'_'+hiddenCellCol).data('hidden', hidden);
                                selectedUserComponent.layout[hiddenCellRow][hiddenCellCol].hidden = hidden;
                                $('#cell'+'_'+hiddenCellRow+'_'+hiddenCellCol).data('merged', merged);
                                selectedUserComponent.layout[hiddenCellRow][hiddenCellCol].merged = merged;

                            }
                        }
                    }
                } else {
                    var topLeftCellId = '';
                    var topRightCellId = '';
                    var bottomLeftCellId = '';
                    var bottomRightCellId = '';
                    selectedUserComponent.layout[row][col].merged.topLeftCellId = topLeftCellId;
                    selectedUserComponent.layout[row][col].merged.topRightCellId = topRightCellId;
                    selectedUserComponent.layout[row][col].merged.bottomLeftCellId = bottomLeftCellId;
                    selectedUserComponent.layout[row][col].merged.bottomRightCellId = bottomRightCellId;

                    cell.data('merged', selectedUserComponent.layout[row][col].merged);
                }
            }

            if (selectedUserComponent.components[row]) {
                var component = selectedUserComponent.components[row][col];
                if (component) {
                    cell.addClass("dropped");
                    cell.removeClass("droppable");
                    cell.droppable('disable');
                    displayComponentInTable(cellId, null, component);
                }
            } else {
                deleteComponentFromView(cellId);
            }
        }
    }

    propagateRatioChangeToAllElts();
    for (var row = 1; row<=numRows; row++){
        for (var col = 1; col<=numCols; col++){
            var cellId = 'cell'+'_'+row+'_'+col;
            refreshContainerDisplay(cellId, currentZoom);
        }
    }

    removeNColsFromEnd(n);
}


/**
 * Removes n columns from the end
 * Does nothing if there is only one column left
 * Mutates selectedUserComponent
 */

function removeNColsFromEnd(n) {
    resetAllMergeHandleVisibility();

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

                var newColspan = lastColNum-n+1-hcCol;
                $('#'+hidingCellId).attr('colspan', newColspan);
                selectedUserComponent.layout[hcRow][hcCol].spans.col = newColspan;

                var mergeData = $('#'+hidingCellId).data('merged');
                var oldBottomRightId = mergeData.bottomRightCellId;
                var oldBottomRightRowcol = getRowColFromId(oldBottomRightId);
                var newBottomRightRow = oldBottomRightRowcol.row;
                var newBottomRightCol = hcCol+newColspan-1;
                var newBottomRightId = 'cell'+'_'+ newBottomRightRow + '_' + newBottomRightCol;

                var oldTopRightId = mergeData.topRightCellId;
                var oldTopRightRowcol = getRowColFromId(oldTopRightId);
                var newTopRightRow = oldTopRightRowcol.row;
                var newTopRightCol = hcCol+newColspan-1;
                var newTopRightId = 'cell'+'_'+ newTopRightRow + '_' + newTopRightCol;

                mergeData.bottomRightCellId = newBottomRightId;
                mergeData.topRightCellId = newTopRightId;

                selectedUserComponent.layout[hcRow][hcCol].merged.bottomRightCellId = newBottomRightId;
                $('#'+hidingCellId).data('merged', mergeData);
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
    scaleTableToZoom();

    bitmapNew = make2dArray(numRows, numCols);
    updateBitmap();
    bitmapOld = JSON.parse(JSON.stringify(bitmapNew));


    if (!savedTableLockedWidth) {
        // if not locked resize the table width accordingly
        // do this after the table has been fitted to the new size
        selectedUserComponent.layout.tablePxDimensions.width = (1-ratioToRemoveGrid)*selectedUserComponent.layout.tablePxDimensions.width
        gridWidth = selectedUserComponent.layout.tablePxDimensions.width * currentZoom;

        saveColRatiosGrid();
    }

    toggleTableWidthLock(savedTableLockedWidth); // in order to lock last col again
    updateZoomNavComponentSize();
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

