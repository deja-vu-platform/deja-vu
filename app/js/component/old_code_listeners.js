/**
 * Created by Shinjini on 10/12/2016.
 */


$('#load-component-btn').on('click', function () {
    selectedUserComponent = UserComponent.fromString($('#component-json').val());
    selectedProject.addComponent(selectedUserComponent);
    loadComponentIntoWorkSurface(selectedUserComponent);
    displayNewComponentInUserComponentList(selectedUserComponent.meta.name,selectedUserComponent.meta.id);
    resetMenuOptions();
});


$('#save-component').on('click', function () {

    window.open("data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(selectedUserComponent, null, '\t')));
});



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
function displayComponentInTable(cellId, widget, component) {
    var type;
    var rowcol = getRowColFromId(cellId);
    var row = rowcol.row;
    var col = rowcol.col;

    if (!component) {
        var span = document.createElement('span');
        span.innerHTML = widget[0].outerHTML;
        type = span.firstElementChild.getAttribute('name');
        component = new BaseComponent(type, {});

        showConfigOptions(type, cellId);

        if (!selectedUserComponent.components[row]) {
            selectedUserComponent.components[row] = {};
        }
        selectedUserComponent.components[row][col] = component;

        // note: no padding here because this is a new component we are adding
        // also note: no properties because of the same reason
        var padding = {top: 0, left: 0, bottom: 0, right: 0};
        selectedUserComponent.components[row][col].padding = padding;
        if (selectedUserComponent.layout.overallStyles){
            selectedUserComponent.components[row][col].properties.custom = selectedUserComponent.layout.overallStyles;
        } else {
            selectedUserComponent.components[row][col].properties.custom = {};
        }
        var properties = selectedUserComponent.components[row][col].properties;

        if (type === 'label') {
            display(cellId, type, getHTML[type]("Type text here..."), currentZoom, padding, properties);
        } else if (type === 'panel') {
            display(cellId, type, getHTML[type]({heading: "Type heading...", content: "Type content..."}), currentZoom, padding, properties);
        } else {
            display(cellId, type, getHTML[type](), currentZoom, padding, properties);
            triggerEdit(cellId, true); // since this is a new component, show edit options
        }

    } else {// a component is there
        type = component.type;

        showConfigOptions(type, cellId);

        if (!widget) {
            $($('.draggable[name=' + type + ']').get(0)).clone().appendTo($('#' + cellId).get(0))
        }
        // display requires widget to be placed before display happens

        var padding = selectedUserComponent.components[row][col].padding;
        var properties = component.properties;

        display(cellId, type, getHTML[type](component.components[type]), currentZoom, padding, properties);

        triggerEdit(cellId, false); // no need to show edit options

    }

    $('#' + cellId).addClass("dropped");
    $('#' + cellId).removeClass("droppable");
    $('#' + cellId).droppable('disable');
    registerDraggable();

    updateBitmap(false);
    registerTooltipBtnHandlers();
}

/** ** ** ** ** ** ** ** ** Table Cells Interaction and display Helpers ** ** ** ** ** ** ** ** **/
function cellTrashDroppableSettings(){
    var enableDrop = {
        accept: ".widget",
        hoverClass: "highlight",
        tolerance: "intersect",
        drop: function(event, ui) {

            if ($(this).attr('id') != "trash") { // if dropped in cell
                $(this).addClass("dropped");
                $(this).removeClass("droppable");
                $(ui.draggable).appendTo(this);
                $(this).droppable('disable');
                var cellId = $(this).attr('id');
                if (!movedComponent()) {
                    displayComponentInTable(cellId, $(ui.draggable));
                }
            }
            //else { // if dropped in trash
            //    var trashCopy = $(this).children().first();
            //    $(ui.draggable).appendTo(this);
            //    $(this).empty();
            //    trashCopy.appendTo($(this));
            //    movedComponent();
            //}

            registerDraggable();
            resetDroppability();
            registerTooltipBtnHandlers();

            //moveCellContentsToDisplayAreaAndScale(currentZoom, cellId);
            //scaleCellComponents(currentZoom, cellId)

        }
    };
    return enableDrop;
}

function registerCellDroppable(cellId){
    $('#'+cellId).droppable(cellTrashDroppableSettings());
}

//
// function registerDroppable() {
//     $('.droppable').each(function(){
//         if (!$(this).hasClass('page-component-toggle-drop')){
//             $(this).droppable(cellTrashDroppableSettings());
//         }
//     });
// }


/**
 * Scales the table, based on the saved sizes, scaled to the zoom factor. If the saved sizes are changed beforhand,
 * this function can be used to resize the table
 */
function scaleTableToZoom(){
    propagateRatioChangeToAllElts();
}


/** Cell droppability*/
function resetDroppabilityAt(cellId){
    if ($('#'+cellId).get(0).getElementsByClassName('draggable').length == 0) {
        $('#'+cellId).removeClass('dropped');
        $('#'+cellId).addClass('droppable');
        $('#'+cellId).droppable('enable');
    }
}

function resetDroppability() {
    $('.cell').each(function() {
        resetDroppabilityAt(this.id);
    });
}

function movedComponent() {

    updateBitmap(false);

    var coord = findDeletedCoord();

    if (coord.length > 0 && typeof coord[0]!=="undefined") { // if not first drop

        var delRow = coord[0];
        var delCol = coord[1];
        if (typeof coord[2]!=="undefined") { // if move, copy any save data
            var newRow = coord[2];
            var newCol = coord[3];

            var innerComponentCopy = selectedUserComponent.components[delRow][delCol];
            selectedUserComponent.addComponent(innerComponentCopy, newRow, newCol);

            var padding = selectedUserComponent.components[delRow][delCol].padding;
            var properties = innerComponentCopy.properties;

            display('cell'+ '_' + newRow + '_' + newCol, innerComponentCopy.type, getHTML[innerComponentCopy.type](innerComponentCopy.components[innerComponentCopy.type]), currentZoom, padding, properties);
            triggerEdit('cell'+ '_' + newRow + '_' + newCol, false);

        }

        deleteComponentFromUserComponentAndFromView("cell"+ '_' + delRow + '_' + delCol);
        return true;
    }
    return false;
}


/** ** ** ** ** ** ** Layout Listeners ** ** ** ** ** ** **/
$('#unmerge-all-cells').click(function(){
    //TODO some sort of warning? Components are placed in the top-left cell
    for (var row = 1; row <= numRows; row++){
        for (var col = 1; col<= numCols; col++){
            var cellId = 'cell'+'_'+row+'_'+col;
            if (selectedUserComponent.components[row]){
                unmergeCells(cellId, selectedUserComponent.components[row][col]);
            } else{
                unmergeCells(cellId);
            }
        }
    }
});


$('#reset-width-ratios').click(function(){
    var widthRatio = 1/numCols;
    for (var row = 1; row <= numRows; row++){
        for (var col = 1; col<= numCols; col++){
            selectedUserComponent.layout[row][col].ratio.grid.width = widthRatio;
        }
    }
    scaleTableToZoom();
});


$('#reset-height-ratios').click(function(){
    var heightRatio = 1/numRows;
    for (var row = 1; row <= numRows; row++){
        for (var col = 1; col<= numCols; col++){
            selectedUserComponent.layout[row][col].ratio.grid.height = heightRatio;
        }
    }
    scaleTableToZoom();
});


$('.add-n-rows input').on('keypress',function(event, ui){
    if (event.which == 13) {
        var value = parseInt($(this).val());
        if (!isNaN(value)){
            addNRowsToEnd(value);
        }
        $(this).val('');
    }
});


$('.remove-n-rows input').on('keypress',function(event, ui){
    if (event.which == 13) {
        var value = parseInt($(this).val());
        if (!isNaN(value)){
            removeNRowsFromEnd(value);
        }

        $(this).val('');
    }
});


$('.add-n-cols input').on('keypress',function(event, ui){
    if (event.which == 13) {
        var value = parseInt($(this).val());
        if (!isNaN(value)){
            addNColsToEnd(value);
        }
        $(this).val('');
    }
});


$('.remove-n-cols input').on('keypress',function(event, ui){
    if (event.which == 13) {
        var value = parseInt($(this).val());
        if (!isNaN(value)){
            removeNColsFromEnd(value);
        }
        $(this).val('');
    }
});

function addResizeToFixedRatiosHandlers(){
    for (var row = 1; row<= numRows; row++){
        var toAdd = '<li><span>Row '+row+'</span> <input type="text"></li>';
        $('#resize-fixed-rows').append(toAdd);
    }

    for (var col = 1; col<= numCols; col++){
        var toAdd = '<li><span>Col '+col+'</span> <input type="text"></li>';
        $('#resize-fixed-cols').append(toAdd);

    }
}

$('#btn-resize-to-inputs').click(function(){
    $('.input-single').each(function() {
        // this exists
        $(this).removeClass('input-single neutral').addClass('input-multiple');
        if ($(this).hasClass('input-single-editing')){
            var rowcol = getRowColFromId($(this).find('.select-unit').get(0).id);
            var type = $(this).data('dimension');
            if (type == 'width'){
                updateSizeValueDisplayAtCol(rowcol.col, false);
            } else {
                updateSizeValueDisplayAtRow(rowcol.row, false);
            }
            $(this).removeClass('input-single-editing');
        }
    });

    $('#resize-to-inputs-done-cancel').css({
        display: 'block',
    });
    $(this).css({
        display: 'none',
    })
});

function resetResizeToInputDisplays(){//ToDO better name
    $('.input-multiple').removeClass('input-multiple').addClass('input-single neutral');

    $('#resize-to-inputs-done-cancel').css({
        display: 'none',
    });
    $('#btn-resize-to-inputs').css({
        display: 'block',
    });
}

$('#btn-resize-to-inputs-cancel').click(function(){
    updateSizeValueDisplay(false);
    resetResizeToInputDisplays();
});

$('#btn-resize-to-inputs-done').click(function(){
    var type = $('.select-unit').val(); // TODO this is a bit sketchy, since we are only sampling one
    if (type == 'px'){
        for (var row = 1; row<= numRows; row++){
            var newRatioRow = parseFloat($('.size-display-height').find('#size-display-value_'+row+'_1').val())/selectedUserComponent.layout.tablePxDimensions.height;
            for (var col = 1; col<= numCols; col++){
                var newRatioCol = parseFloat($('.size-display-width').find('#size-display-value_1_'+col).val())/selectedUserComponent.layout.tablePxDimensions.width
                selectedUserComponent.layout[row][col].ratio.grid.width = newRatioCol;
                selectedUserComponent.layout[row][col].ratio.grid.height = newRatioRow;
            }
        }
        scaleTableToZoom(); // this resizes the table based on the above changes in size
        saveTableSizeAndRowColRatiosGrid(true, true); // this resets the saved ratios to the correct ones
        updateSizeValueDisplay(false);
    } else if (type == '%'){
        var ratiosRow = [];
        var ratiosCol = [];
        for (var row = 1; row<= numRows; row++){
            ratiosRow.push(parseFloat($('.size-display-height').find('#size-display-value_'+row+'_1').val())/100);
        }
        for (var col = 1; col<= numCols; col++){
            ratiosCol.push(parseFloat($('.size-display-width').find('#size-display-value_1_'+col).val())/100);
        }

        resizeColsBySetRatios(ratiosCol);
        resizeRowsBySetRatios(ratiosRow);
    }
    resetResizeToInputDisplays();
});


$('#display-cell').click(function(event){
    if (!$(allElementsFromPoint(event.clientX, event.clientY)).filter('[contenteditable=true]').get(0)){
        $( document.activeElement ).blur();
    }
});

function switchToInnerComponentFocusMode(row, col){
    $('#inner-component-focus #display-cell').html('');
    $('#inner-component-focus').find('.tooltip').remove();

    $('#inner-component-focus #display-cell').removeData();

    $('#style-overall-vs-specific').text('Specific, Row:'+row+' Col:'+col);

    var componentToShow = selectedUserComponent.components[row][col];
    var type = componentToShow.type;

    var cellId = 'cell'+'_'+row+'_'+col;
    $('#display-cell').data('cellid',cellId);

    setUpInnerComponentOptions(cellId);

    toggleInnerComponentVisibility(false);

    // dealing with merges
    var bottomRightCellId = $('#'+cellId).data('merged').bottomRightCellId;
    if (bottomRightCellId.length == 0){
        bottomRightCellId = cellId;
    }

    var actualHeight = 0;
    var actualWidth = 0;
    var endRowCol = getRowColFromId(bottomRightCellId);
    var endRow = parseInt(endRowCol.row);
    var endCol = parseInt(endRowCol.col);
    for (var mergeRow = row; mergeRow<=endRow; mergeRow++){
        actualHeight += selectedUserComponent.layout[mergeRow][col].ratio.grid.height * selectedUserComponent.layout.tablePxDimensions.height;
    }
    for (var mergeCol = col; mergeCol<=endCol; mergeCol++){
        actualWidth += selectedUserComponent.layout[row][mergeCol].ratio.grid.width * selectedUserComponent.layout.tablePxDimensions.width;
    }

    $('#inner-component-focus').css({
        width: '600px',
        height: '600px',
    });

    var widthScale = ($('#inner-component-focus').width())/actualWidth;
    var heightScale = ($('#inner-component-focus').height())/actualHeight;

    var scale = Math.min(widthScale, heightScale);

    $('#display-cell').data('display-cell-scale', scale);


    $('#inner-component-focus').css({ // update the width and height to something that actually looks like the cell
        height: actualHeight*scale + 'px',
        width: actualWidth*scale + 'px',
        //border: '5px solid white',
        'background-color': '#F9F9F9',
        position: 'relative',
    });

    var padding = selectedUserComponent.components[row][col].padding;
    if (!padding){
        padding = {top: 0, bottom: 0, left: 0, right: 0};
    }

    var displayTop = padding.top*actualHeight*scale;
    var displayLeft = padding.left*actualWidth*scale;
    var displayHeight = (1-padding.top-padding.bottom)*actualHeight*scale;
    var displayWidth = (1-padding.left-padding.right)*actualWidth*scale;

    $('#display-cell').css({
        height: displayHeight + 'px',
        width: displayWidth + 'px',
        display: 'table-cell',
        'text-align': 'center',
        'vertical-align': 'middle',
        border: '1px grey solid',
        position: 'absolute',
        top: displayTop,
        left: displayLeft,
    });

    $('#display-cell-resize-helper').css({
        height: displayHeight + 'px',
        width: displayWidth + 'px',
        'pointer-events': 'none',
        position: 'absolute',
        top: displayTop,
        left: displayLeft,
        'z-index':100,
    });

    // this isn't actually refreshing but this still works
    refreshContainerDisplay('display-cell', scale);


    $('#display-cell').children().css('position', 'relative');
    $('#display-cell-resize-handle').css({
        position: 'absolute',
        bottom: 0,
        right: 0,
        'pointer-events': 'auto'
    });

    $('#display-cell-resize-helper').resizable({
        handles: {
            'se': $('#display-cell-resize-handle')
        },

        start: function(e, ui){
            $('#display-cell-resize-helper').css({
                border: 'black 1px dotted',
            });

            //e.stopPropagation();
        },
        stop: function (e, ui) {
            $('#display-cell-resize-helper').css({
                border: 'none',
            });
            $('#inner-component-focus #display-cell').children().each(function(){
                if (!$(this).hasClass('tooltip')){
                    $(this).remove();
                }
            });
            $('#inner-component-focus #display-cell').css({
                height: $('#display-cell-resize-helper').css('height'),
                width: $('#display-cell-resize-helper').css('width'),
            });
            // NOTE: shouldn't use any padding here
            var padding = null;
            var properties = selectedUserComponent.components[row][col].properties;


            display('display-cell', type, getHTML[type](componentToShow.components[type]), scale, padding, properties);


            //$('#inner-component-focus #display-cell').css({
            //    height: $('#display-cell .display-component').css('height'),
            //    width: $('#display-cell .display-component').css('width'),
            //});
            //
            //
            //$('#inner-component-focus #display-cell-resize-helper').css({
            //    height: $('#display-cell .display-component').css('height'),
            //    width: $('#display-cell .display-component').css('width'),
            //});


            var top = $(this).position().top/$('#inner-component-focus').height();
            var bottom = 1 - ($(this).position().top + $(this).height())/$('#inner-component-focus').height();
            var left = $(this).position().left/$('#inner-component-focus').width();;
            var right = 1 - ($(this).position().left + $(this).width())/$('#inner-component-focus').width();

            var cellId = $('#display-cell').data('cellid');
            var rowcol = getRowColFromId(cellId);

            selectedUserComponent.components[rowcol.row][rowcol.col].padding = {top: top, left: left, bottom: bottom, right: right}
            refreshContainerDisplay(cellId, currentZoom);
        },
        containment: '#inner-component-focus',
    });



    $('#display-cell').draggable({
        containment: '#inner-component-focus',
        drag: function(){
            $('#display-cell-resize-helper').css({
                top: $(this).position().top,
                left: $(this).position().left,
            });
        },
        stop: function(){
            $('#display-cell-resize-helper').css({
                top: $(this).position().top,
                left: $(this).position().left,
            });

            var top = $(this).position().top/$('#inner-component-focus').height();
            var bottom = 1 - ($(this).position().top + $(this).height())/$('#inner-component-focus').height();
            var left = $(this).position().left/$('#inner-component-focus').width();;
            var right = 1 - ($(this).position().left + $(this).width())/$('#inner-component-focus').width();

            var cellId = $('#display-cell').data('cellid');
            var rowcol = getRowColFromId(cellId);

            selectedUserComponent.components[rowcol.row][rowcol.col].padding = {top: top, left: left, bottom: bottom, right: right}
            refreshContainerDisplay(cellId, currentZoom);
        }
    });


}

function setUpInnerComponentOptions(cellId){
    var rowcol  = getRowColFromId(cellId);
    var row = rowcol.row;
    var col = rowcol.col;

    $('.back-to-all-components').unbind().click(function(){
        toggleInnerComponentVisibility(true);
        // refresh it after toggling, or else the display function will got get the right
        // dimensions of the cells (for merged cells)
        refreshContainerDisplay(cellId, currentZoom);
    });
    $('.btn-delete-inner-component').unbind().click(function(){
        deleteComponentFromUserComponentAndFromView(cellId);
        toggleInnerComponentVisibility(true);
    });

    var type = selectedUserComponent.components[row][col].type;

    if (type == 'label'|| type=='panel'){
        $('.inner-component-options .edit-btn').css({
            display: 'none',
        });
    } else {
        $('.inner-component-options .edit-btn').css({
            display: 'inline-block',
        });
        var tooltipClone = $('#'+cellId).find('.tooltip').clone(true, true);
        $('#inner-component-focus').append(tooltipClone);

        $('.inner-component-options .edit-btn').unbind().on("click", function (e) {
            $('#inner-component-focus').find('.tooltip').addClass('open');
        });
    }

    showConfigOptions(type, 'display-cell');

}


/**
 * Deletes a component from the datatype and also from the view
 */
function deleteComponentFromUserComponentAndFromView(cellId) {
    var rowcol = getRowColFromId(cellId);
    var row = rowcol.row;
    var col = rowcol.col;

    if (selectedUserComponent.components[row]) {
        if (selectedUserComponent.components[row][col]) {
            delete selectedUserComponent.components[row][col];
        }
    }
    deleteComponentFromView(cellId);
    updateBitmap(false);

}



function toggleInnerComponentVisibility(showAll){
    if (showAll){
        $('#inner-component-focus #display-cell').html('');
        $('#inner-component-focus').find('.tooltip').remove();
        $('#inner-component-focus').find('.config-btns').remove()

        $('#inner-component-focus #display-cell').removeData();

        $('#inner-component-focus').css('display', 'none');
        $('#outer-container').css('display', 'block');

        $('.inner-component-options').css('display', 'none');
        $('.component-options').css('display', 'block');

        $('#zoom-control').css('display', 'block');
        $('#zoom-nav-container').css('display', 'block');

        $('#style-overall-vs-specific').text('Overall');
        innerComponentFocused = false;


    } else {
        $('#inner-component-focus').css('display', 'block');
        $('#outer-container').css('display', 'none');

        $('.inner-component-options').css('display', 'block');
        $('.component-options').css('display', 'none');

        $('#zoom-control').css('display', 'none');
        $('#zoom-nav-container').css('display', 'none');

        innerComponentFocused = true;

    }
    setUpStyleColors();
}



/**
 * Updates the contents of a base component info at a particular cell based on inputs
 * @param cellId
 */
function updateBaseComponentContentsAndDisplayAt_OLD(cellId) {
    // NOTE: actual cell is the cell in the main table
    // cellId could be either display-cell or the actual cell id, but it is the one
    // that contains text edits
    // tooltip is the tooltip currently being edited

    var actualCellId;
    var cell;
    var tooltip;
    var componentId;
    if (cellId == 'display-cell') {
        actualCellId = $('#display-cell').data('cellid');
        tooltip = $('#inner-component-focus').find('.tooltip');
        componentId = null; //TODO
    } else {
        actualCellId = cellId;
        cell = $('#'+cellId);
        tooltip = cell.find('.tooltip');
        componentId = cell.data('componentId');
    }

    var type = $('#' + actualCellId).get(0).getElementsByClassName('draggable')[0].getAttribute('name');
    var value;
    var isUpload = false;
    //var inputs = Array.prototype.slice.call(
    //    $('#' + cellId).get(0).getElementsByTagName('input'), 0);


    if (tooltip.length>0){
        var inputs = Array.prototype.slice.call(
            tooltip.get(0).getElementsByTagName('input'), 0);
    } // else it is label and is handled

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
                    value.img_src = savedFile.url();
                    selectedUserComponent.components[componentId].components[type] = value;

                    //selectedUserComponent.components[row][col].components[type] = value;
                    refreshContainerDisplay(actualCellId, currentZoom);
                    if (cellId=='display-cell'){
                        refreshContainerDisplay('display-cell', parseFloat($('#display-cell').data('display-cell-scale')));
                    }
                });
        } else { // pasted link to image
            if (inputs[0].value.length>0){
                value.img_src = inputs[0].value;
            } else {
                value.img_src = 'images/image_icon.png';
            }
        }
    } else if (type === 'panel') {
        value = {
            heading: $('#' + cellId).find('.panel-title')[0].textContent,
            content: $('#' + cellId).find('.panel-html')[0].textContent
        }
    }

    if (!isUpload) {
        //selectedUserComponent.components[row][col].components = {};
        //selectedUserComponent.components[row][col].components[type] = value;
        selectedUserComponent.components[componentId].components = {};
        selectedUserComponent.components[componentId].components[type] = value;


        refreshContainerDisplay(actualCellId, currentZoom);
        if (cellId=='display-cell'){
            refreshContainerDisplay('display-cell', parseFloat($('#display-cell').data('display-cell-scale')));
        }
    }
}

