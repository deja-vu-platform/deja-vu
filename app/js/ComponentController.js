var numRows = DEFAULT_ROWS;
var numCols = DEFAULT_COLS;
var cellWidth = DEFAULT_CELL_WIDTH;
var cellHeight = DEFAULT_CELL_HEIGHT;
var files = [];

// currently save components in this array
var userComponents = [];
var numComponents = userComponents.length - 1; // -1 to enable 0-indexing
var selectedUserComponent = null;
var bitmapOld = null;
var bitmapNew = null;

var gridWidth;
var gridHeight;

// Initialization
$(function () {
    Parse.initialize("8jPwCfzXBGpPR2WVW935pey0C66bWtjMLRZPIQc8", "zgB9cjo7JifswwYBTtSvU1MSJCMVZMwEZI3Etw4d");
    selectedUserComponent = "in jq";

    // start a default component
    initClicheComponent(true);
    var grid = $('#table-container').get(0);
    gridWidth = grid.offsetWidth;
    gridHeight = grid.offsetHeight;
    createTable(gridWidth, gridHeight);

});

$('#select-rows').on('change', function (e) {
    numRows = $(this).val();
});

$('#select-cols').on('change', function (e) {
    numCols = $(this).val();
});

$('#create-component').on('click', function () {
    initClicheComponent(false);
    createTable(gridWidth, gridHeight, false);
    resetMenuOptions();
});

$('#load-component-btn').on('click', function () {
    selectedUserComponent = JSON.parse($('#component-json').val());
    loadTable(gridWidth, gridHeight, selectedUserComponent);
    addComponentToUserComponentsList(selectedUserComponent);
    resetMenuOptions();
});

$('#save-component').on('click', function () {

    window.open("data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(selectedUserComponent, null, '\t')));

    //w = window.open();
    //w.document.body.innerHTML='<a href="data:' + data + '" download="data.json">' +
    //    'Download JSON</a>'+'<p><textarea style="width:95%; height:95%">'+
    //    JSON.stringify(selectedUserComponent, null, '\t')+'</textarea></p>';
});

$('#user-components-list').on('click', 'li', function () {
    var componentNumber = $(this).data('componentnumber');
    $('#selected').removeAttr('id');
    $($('#user-components-list li')[componentNumber]).attr('id', 'selected');
    selectedUserComponent = userComponents[componentNumber];
    loadTable(gridWidth, gridHeight, selectedUserComponent);
});

$('#user-components-list').on('dblclick', '.component-name', function () {
    var componentNumber = $(this).parent().data('componentnumber');
    var componentToRename = $($('#user-components-list li')[componentNumber]);
    var newNameInputElt = $(componentToRename.find('.new-name-input'));
    var submitRenameElt = $(componentToRename.find('.submit-rename'));
    newNameInputElt.val($(this).text());
    submitRenameElt.removeClass('not-displayed');
    $(this).addClass('not-displayed');
    newNameInputElt.focus();
    newNameInputElt.select();
});

$('#user-components-list').on('keypress', '.new-name-input', function (event) {
    if (event.which == 13) {
        event.preventDefault();
        var componentNumber = $(this).parent().parent().data('componentnumber');
        var componentToRename = $($('#user-components-list li')[componentNumber]);
        var componentNameElt = $(componentToRename.find('.component-name'));
        var submitRenameElt = $(componentToRename.find('.submit-rename'));


        componentNameElt.removeClass('not-displayed');
        submitRenameElt.addClass('not-displayed');
        var newName = $(this).val();
        if (newName.length === 0) { // empty string entered, don't change the name!
            return;
        }
        componentNameElt.text($(this).val());
        // update the display of the component box
        $('<style>.maintable::after{content:"' + $(this).val() + '"}</style>').appendTo('head');

        selectedUserComponent.meta.name = $(this).val();
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
    var rowspan = selectedUserComponent.layout[row][col][0];
    var colspan = selectedUserComponent.layout[row][col][1];

    var isMerged = selectedUserComponent.layout[row][col][2];
    var lastMergedBottomRightCellId = selectedUserComponent.layout[row][col][3];

    $(td).data('merged', isMerged);
    $(td).data('merged-cell-bottom-right', lastMergedBottomRightCellId);

    if (rowspan === 0) { // and thus also colspan
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
    tableGrid.className = 'maintable';
    for (var row = 1; row <= numRows; row++) {
        var tr = createEmptyRow(row);
        for (var col = 1; col <= numCols; col++) {
            var td = createTableCell(row, col);
            tr.appendChild(td);
        }
        tableGrid.appendChild(tr);

    }

    document.getElementById('table-container').appendChild(tableGrid);

    initialResizeCells(gridWidth, gridHeight, numRows, numCols);

    attachMergeHandlers();
    registerDroppable();

    bitmapOld = make2dArray(numRows, numCols);
    bitmapNew = make2dArray(numRows, numCols);

    createGuideGrid();
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

            var rowspan = selectedUserComponent.layout[row][col][0];
            var colspan = selectedUserComponent.layout[row][col][1];

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
    grid.className = 'maintable';

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


/**
 * Creates and displays a table based on the component given
 * @param componentToShow
 */
function loadTable(gridWidth, gridHeight, componentToShow) {
    $('<style>.maintable::after{content:"' + componentToShow.meta.name + '"}</style>').appendTo('head');
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
function initialResizeCells(gridWidth, gridHeight, numRows, numCols) {
    cellWidth = Math.floor((gridWidth / numCols)) - 15;
    cellHeight = Math.floor((gridHeight / numRows)) - 15;
    var tooltipWidth = Number($('.tooltip').css('width').substring(0, 3));

    getCSSRule('td').style.setProperty('width', cellWidth + 'px', null);
    getCSSRule('td').style.setProperty('height', cellHeight + 'px', null);
    getCSSRule('.tooltip').style.setProperty('left', -1 * Math.floor((tooltipWidth - (cellWidth - 40)) / 2) + 'px', null);

    resizeLabelDivs(cellWidth, cellHeight);

}

/**
 * Adds a component to the list of user components
 * @param newComponent
 */
function addComponentToUserComponentsList(newComponent) {
    userComponents.push(newComponent);
    numComponents += 1;
    selectedUserComponent = newComponent;

    // display the newly added component to the user components list
    $('#selected').removeAttr("id");

    var newComponentElt = '<li id="selected" data-componentnumber=' + numComponents + '>'
        + '<span class="component-name">' + newComponent.meta.name + '</span>'
        + '<span class="submit-rename not-displayed">'
        + '<input type="text" class="new-name-input form-control" autofocus>'
        + '</span>'
        + '</li>';
    $('#user-components-list').append(newComponentElt);
    $('#selected #modal-title-1').text(name);

};

/**
 * Creates a new Cliche (but actually User?) component based on user inputs
 * @param isDefault
 * @constructor
 */
function initClicheComponent(isDefault) {
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
    $('<style>.maintable::after{content:"' + name + '"}</style>').appendTo('head');
    var newComponent = new ClicheComponent({rows: numRows, cols: numCols}, name, 1, version, author);

    addComponentToUserComponentsList(newComponent);
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
    //selectedUserComponent.addComponent(component, row, col);
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
    if (merged) {
        var lastMergedCellBottomRightId = $('#' + topLeftCellId).data('merged-cell-bottom-right');
        // if merged, unmerge the two cells
        // this also resets the cells to unmerged status
        unmergeCells(topLeftCellId, lastMergedCellBottomRightId);
    }

    if (topLeftCellId != bottomRightCellId) { // not merging/unmerging to the same cell,
        // that is, the cell is actually merging to something else
        // mark cell as merged
        $('#' + topLeftCellId).data('merged', true);
        $('#' + topLeftCellId).data('merged-cell-bottom-right', bottomRightCellId);
        // hide all the other cells in that block
        for (var row = topRowNum; row <= bottomRowNum; row++) {
            for (var col = leftColNum; col <= rightColNum; col++) {
                var cellId = "cell" + '_' + row.toString() + '_' + col.toString();

                // delete any component that was there
                // TODO: note: checks should be made before calling this function!
                deleteComponent(cellId);

                if ((row == topRowNum) && (col == leftColNum)) { // the cell we just made bigger
                    continue;
                }

                // figure out if this is already a merged cell
                var merged = $('#' + cellId).data('merged');
                if (merged) {
                    var lastMergedCellBottomRightId = $('#' + cellId).data('merged-cell-bottom-right');
                    // if merged, unmerge the two cells
                    // this also resets the cells to unmerged status
                    unmergeCells(cellId, lastMergedCellBottomRightId);
                }


                // then hide the other cells
                var cellToHide = $("#" + cellId);
                cellToHide.css("display", "none");

                // return rowspan/colspan to 1
                cellToHide.attr("rowSpan", 1);
                cellToHide.attr("colSpan", 1);

                var dragContainerToHide = $('#drag-handle-container' + '_' + row + '_' + col);
                dragContainerToHide.css('display', 'none');

                selectedUserComponent.layout[row][col] = [0, 0, false, ''];
            }
        }

    }

    // Make the first cell take the correct size
    var cellTopRight = $("#" + topLeftCellId);
    var rowspan = bottomRowNum - topRowNum + 1;
    var colspan = rightColNum - leftColNum + 1;
    cellTopRight.attr("rowSpan", rowspan);
    cellTopRight.attr("colSpan", colspan);
    $('#drag-handle-container' + '_' + topRowNum + '_' + leftColNum).css({
        width: cellTopRight.css('width'),
        height: cellTopRight.css('height'),
    });

    // update the datatype
    selectedUserComponent.layout[topRowNum][leftColNum] = [rowspan, colspan, true, bottomRightCellId];

    // then put the component in there
    if (component) {
        // add the component to the cell
        addComponent(topLeftCellId, false, component);
    }
}

function unmergeCells(cell1Id, cell2Id, component) {
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


    // Make the first cell take the correct size
    var topLeftCellId = "cell" + '_' + topRowNum.toString() + '_' + leftColNum.toString();

    var cellTopRight = $("#" + topLeftCellId);
    cellTopRight.attr("rowSpan", 1);
    cellTopRight.attr("colSpan", 1);
    // display all the other cells in that block
    for (var row = topRowNum; row <= bottomRowNum; row++) {
        for (var col = leftColNum; col <= rightColNum; col++) {
            var cellId = "cell" + '_' + row.toString() + '_' + col.toString();
            // update the datatype
            selectedUserComponent.layout[row][col] = [1, 1, false, ''];

            var cellToShow = $("#" + cellId);
            cellToShow.css("display", "table-cell");

            // reset some meta data
            cellToShow.data('merged', false);
            cellToShow.data('merged-cell-bottom-right', '');

            // return rowspan/colspan to 1
            cellToShow.attr("rowSpan", 1);
            cellToShow.attr("colSpan", 1);

            // delete any component that was there
            deleteComponent(cellId);

            var dragContainerToShow = $('#drag-handle-container' + '_' + row + '_' + col);
            var cellOffset = cellToShow.offset();
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

}


/*
 Adding and deleting rows and columns
 */

/**
 * Adds a row to the end
 * Mutates selectedUserComponent
 */
function addRowToEnd() {
    var lastRowNum = selectedUserComponent.dimensions.rows;

    // datatype update
    selectedUserComponent.dimensions.rows += 1;
    numRows += 1;
    selectedUserComponent.layout[lastRowNum + 1] = {}

    // visual update
    var tableRow = createEmptyRow(lastRowNum + 1);
    var gridRow = createEmptyRow(lastRowNum + 1);

    for (var i = 1; i <= selectedUserComponent.dimensions.cols; i++) {
        selectedUserComponent.layout[lastRowNum + 1][i] = [1, 1, false, ''];
        var tableCell = createTableCell(lastRowNum + 1, i);
        tableRow.appendChild(tableCell);
        var gridCell = createGridCell(lastRowNum + 1, i);
        gridRow.appendChild(gridCell);
    }
    $('#table-container table').append(tableRow);
    $('#guide-grid-container table').append(gridRow);

    attachMergeHandlers();
    bitmapNew = make2dArray(numRows, numCols);
    updateBitmap();
    // from http://stackoverflow.com/questions/597588/how-do-you-clone-an-array-of-objects-in-javascript
    bitmapOld = JSON.parse(JSON.stringify(bitmapNew)); // as not to have issues with the old and the new having
    // different numbers of rows
}

/**
 * Removes the end row
 * Does nothing if there is only one row left
 * Mutates selectedUserComponent
 */
function removeEndRow() {

}

/**
 * Adds a column to the end
 * Mutates selectedUserComponent
 */
function addColToEnd() {

}

/**
 * Remove end columns
 * Does nothing if there is only one column left
 * Mutates selectedUserComponent
 */
function removeEndCol() {

}