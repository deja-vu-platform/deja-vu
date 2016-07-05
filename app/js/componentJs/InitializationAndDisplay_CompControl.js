// This file mostly has the initialization and functions that help with
// the display and interaction handling


var projectsSavePath = path.join(__dirname, 'projects');
var addedCliches;


/** ** ** ** ** ** Initialization ** ** ** ** ** **/
$(function () {
    Parse.initialize("8jPwCfzXBGpPR2WVW935pey0C66bWtjMLRZPIQc8", "zgB9cjo7JifswwYBTtSvU1MSJCMVZMwEZI3Etw4d");

    // get selected project
    selectedProject = window.sessionStorage.getItem('selectedProject');
    if (selectedProject){ // if it exists, load it
        selectedProject = UserProject.fromString(selectedProject);
    } else { // if not, make a new one
        selectedProject = new UserProject(DEFAULT_PROJECT_NAME, generateId(DEFAULT_PROJECT_NAME), DEFAULT_VERSION, DEFAULT_AUTHOR);
    }

    $('.project-name .header').text(selectedProject.meta.name);

    addedCliches = selectedProject.addedCliches;
    for (var id in addedCliches) {
        showClicheInList(id, addedCliches[id].name);
    }

    if (selectedProject.numComponents === 0){
        // start a default component
        selectedUserComponent = initUserComponent(true);
        selectedProject.addComponent(selectedUserComponent.meta.id, selectedUserComponent);
        createTable();
        displayUserComponentInListAndSelect(selectedUserComponent.meta.name, selectedUserComponent.meta.id);
    } else {
        var componentToLoadId = Object.keys(selectedProject.components)[0]; //TODO
        selectedUserComponent = selectedProject.components[componentToLoadId];
        if (componentToLoadId in selectedProject.mainComponents){
            displayMainPageInListAndSelect(selectedUserComponent.meta.name, componentToLoadId);
        } else {
            displayUserComponentInListAndSelect(selectedUserComponent.meta.name, componentToLoadId);
        }
        for (var componentId in selectedProject.components){
            if (componentId != componentToLoadId){
                var componentName = selectedProject.components[componentId].meta.name;
                if (componentId in selectedProject.mainComponents){
                    displayMainPageInListAndSelect(componentName, componentId)
                } else {
                    displayNewComponentInUserComponentList(componentName, componentId);
                }


            }
        }
        loadTable(selectedUserComponent);
    }

    //autoSave5Mins();

    basicComponents = $('#basic-components').html();

    registerDroppable();

    registerDraggable();

    registerZoom();

});



/** ** ** ** ** ** Menu Event Handlers ** ** ** ** ** **/


// TODO on user component name input check for special chars

$('#create-component').on('click', function () {
    numRows = $('#select-rows').val();
    numCols = $('#select-cols').val();
    selectedUserComponent = initUserComponent(false);
    selectedProject.addComponent(selectedUserComponent.meta.id, selectedUserComponent);
    displayUserComponentInListAndSelect(selectedUserComponent.meta.name, selectedUserComponent.meta.id);
    createTable();
    resetMenuOptions();
});

$('#load-component-btn').on('click', function () {
    selectedUserComponent = UserComponent.fromString($('#component-json').val());
    selectedProject.addComponent(selectedUserComponent.meta.id, selectedUserComponent);
    loadTable(selectedUserComponent);
    displayNewComponentInUserComponentList(selectedUserComponent.meta.name,selectedUserComponent.meta.id);
    resetMenuOptions();
});

$('#save-component').on('click', function () {

    window.open("data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(selectedUserComponent, null, '\t')));
});

$('#save-project').on('click', function () {
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
    saveObjectToFile(projectsSavePath, projectNameToFilename(selectedProject.meta.name), selectedProject);
    //downloadObject(selectedProject.meta.name+'.json', selectedProject);
});


/** ** ** ** ** ** Menu Related Functions ** ** ** ** ** **/

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

/** ** ** ** ** ** Components Event Handlers ** ** ** ** ** **/

$('#back-to-projects').click(function(event){
    event.preventDefault();
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject)); // save the updated project
    saveObjectToFile(projectsSavePath, projectNameToFilename(selectedProject.meta.name), selectedProject);
    window.location = 'projectView.html';
});

$('.components').on('click', '.component-name-container', function () {
    var componentId = $(this).parent().data('componentid');
    $('.selected').removeClass('selected');
    $(this).parent().addClass('selected');
    selectedUserComponent = selectedProject.components[componentId];
    loadTable(selectedUserComponent);
});

$('.components').on('dblclick', '.component-name', function () {
    var newNameInputElt = $($(this).parent().find('.new-name-input'));
    var submitRenameElt = $($(this).parent().find('.submit-rename'));
    newNameInputElt.val($(this).text());
    submitRenameElt.removeClass('not-displayed');
    $(this).addClass('not-displayed');
    newNameInputElt.focus();
    newNameInputElt.select();
});

$('.components').on('keypress', '.new-name-input', function (event) {
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

        // changing the ids todo: is this a good idea?
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

/** ** ** ** ** ** Component Adding to Project and Display helpers ** ** ** ** ** ** ** ** ** **/


function displayUserComponentInListAndSelect(name, id){
    $('.selected').removeClass("selected");
    displayNewComponentInUserComponentList(name,id);
    $("#user-components-list").find("[data-componentid='" + id + "']").addClass('selected');
}

/**
 * Adds a component to the list of user components
 * @param newComponent
 */
function displayNewComponentInUserComponentList(name, id){
    var newComponentElt =
          '<li data-componentid=' + id + '>'
            + '<div class="component-name-container">'
                + '<span class="component-name">' + name + '</span>'
                + '<span class="submit-rename not-displayed">'
                    + '<input type="text" class="new-name-input form-control" autofocus>'
                + '</span>'
            + '</div>'
        + '</li>';
    $('#user-components-list').append(newComponentElt);
    addDeleteUserComponentButton(id);
}


/**
 * Adds a component to the list of user components
 * @param newComponent
 */
function displayNewComponentInMainPagesList(name, id){
    var newComponentElt =
        '<li data-componentid=' + id + '>'
        + '<div class="component-name-container">'
            + '<span class="component-name">' + name + '</span>'
                + '<span class="submit-rename not-displayed">'
                + '<input type="text" class="new-name-input form-control" autofocus>'
            + '</span>'
        + '</div>'
        + '</li>';
    $('#main-pages-list').append(newComponentElt);
    addDeleteUserComponentButton(id);
}

function displayMainPageInListAndSelect(name, id){
    $('.selected').removeClass("selected");
    displayNewComponentInMainPagesList(name,id);
    $("#main-pages-list").find("[data-componentid='" + id + "']").addClass('selected');
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

        if (!widget) {
            $($('.draggable[name=' + type + ']').get(0)).clone().appendTo($('#' + cellId).get(0))
        }
        // display requires widget to be placed before display happens
        Display(cellId, getHTML[type](component.components[type]));

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
    registerTooltipBtnHandlers();
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
            var cell = $('#cell' + '_' + row + '_' + col).get(0);

            $(cell).find('.config-btns').remove();
            $(cell).find('.tooltip').remove();
            $(cell).find('.label-container').remove();
            $(cell).find('.display-component').remove();
            $(cell).find('.widget').remove();

            resetDroppabilityAt(cellId);
            updateBitmap();

        }
    }

}

/**
 * Updates the contents of a base component info at a particular cell based on inputs
 * @param cellId
 */
function updateBaseComponentContentsAndDisplayAt(cellId) {
    var rowcol = getRowColFromId(cellId);
    var row = rowcol.row;
    var col = rowcol.col;

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
            if (inputs[0].value.length>0){
                value.img_src = inputs[0].value;
            } else {
                value.img_src = 'images/image_icon.png';
            }
        }
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



/** ** ** ** ** ** ** ** IMAGE UPLOAD HELPERS ** ** ** ** ** ** ** **/
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



/** ** ** ** ** ** ** ** ** Table Cells Interaction and Display Helpers ** ** ** ** ** ** ** ** **/

function registerDroppable() {
    enableDrop = {
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
                var droppedComponent =$('#'+cellId).children().last().attr('name').toLowerCase();
                showConfigOptions(droppedComponent, document.getElementById(cellId));
                if (!movedComponent()) {
                    displayComponentInTable(cellId, $(ui.draggable));
                }
            } else { // if dropped in trash
                var trashCopy = $(this).children().first();
                $(ui.draggable).appendTo(this);
                $(this).empty();
                trashCopy.appendTo($(this));
                movedComponent();
            }

            $('#basic-components').html(basicComponents);

            registerDraggable();
            resetDroppability();
            registerTooltipBtnHandlers();


        }
    };
    $('.droppable').each(function() {
        $(this).droppable(enableDrop);
    });
}

function registerDraggable() {

    $('.widget').each(function() {
        $(this).draggable({
            opacity: 1,
            revert: "invalid",
            cursorAt: { top: 0, left: 0 },
            helper: function(){
                $('#table-container').append('<div id="clone" class="widget">' + $(this).html() + '</div>');
                //Hack to append the widget to the body (visible above others divs), but still belonging to the scrollable container
                $("#clone").hide();
                setTimeout(function(){$('#clone').appendTo('body'); $("#clone").show();},1);
                return $("#clone");
            },
            appendTo: 'body',
            containment: 'body',
            cursor: '-webkit-grabbing',
            scroll: true
        });
    });

}

function registerZoom() {
    $('#zoomIn').click( function (e) {
        e.preventDefault();
        $('#middle-container').animate({ 'zoom': currentZoom = 1 }, 'slow');
        $('.main-table').after().css('font-size', '14px');
    });
    $('#zoomOut').click( function (e) {
        e.preventDefault();
        $('#middle-container').animate({ 'zoom': currentZoom = 0.4 }, 'slow');
        //$('.main-table').after().css('font-size', '50px');
    });

}

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

    updateBitmap();

    var coord = findDeletedCoord();

    if (coord.length > 0 && typeof coord[0]!=="undefined") { // if not first drop

        var delRow = coord[0];
        var delCol = coord[1];
        if (typeof coord[2]!=="undefined") { // if move, copy any save data
            var newRow = coord[2];
            var newCol = coord[3];

            var componentCopy = selectedUserComponent.components[delRow][delCol];
            selectedUserComponent.addComponent(componentCopy, newRow, newCol);

            Display('cell'+ '_' + newRow + '_' + newCol, getHTML[componentCopy.type](componentCopy.components[componentCopy.type]));
            triggerEdit('cell'+ '_' + newRow + '_' + newCol, false);

        }

        deleteComponentFromUserComponentAndFromView("cell"+ '_' + delRow + '_' + delCol);
        return true;
    }
    return false;
}

/**
 * Register listener for click on edit button
 * @param cellId
 */
function triggerEdit(cellId, popup) {
    var droppedComponent =$('#'+cellId).children().last().attr('name').toLowerCase();

    var editDialogTemplate = $('#'+droppedComponent+'-popup-holder').html();

    var sp = document.createElement('span');
    sp.innerHTML = editDialogTemplate;
    var editDialog = sp.firstElementChild;

    var cell = document.getElementById(cellId);
    cell.insertBefore(editDialog, cell.firstChild);

    $(Array.prototype.slice.call(
        $('#'+cellId).get(0).getElementsByClassName('form-control'), 0)[0]).trigger("focus");
    if (popup){
        setTimeout(function(){
            $($('#'+cellId).children().first()).addClass('open');
        }, 1);
    }

}

function showConfigOptions(droppedComponentType, cell) {
    // Hide edit button if label or panel
    if (droppedComponentType==='label' || droppedComponentType==='panel') {
        $('#'+cell.id).find('.edit-btn').css('visibility', 'hidden');
    } else {
        $('#'+cell.id).find('.edit-btn').css('visibility', 'visible');
    }

    var configOptions = document.getElementById(droppedComponentType+'-properties');
    if (configOptions==null || configOptions==undefined) {
        return;
    }

    var sp = document.createElement('span');
    sp.innerHTML = configOptions.innerHTML;
    var configDiv = sp.firstElementChild;

    cell.insertBefore(configDiv, cell.firstChild);
}


function registerTooltipBtnHandlers() {
    $('.close').on("click", function() {
        setTimeout(function(){
            $('.tooltip').removeClass('open');
        }, 1);
        Array.prototype.slice.call(
            $(this).parent().get(0).getElementsByClassName('form-control'), 0)
            .forEach(function(item) {
                item.value = "";
            })
    });

    $('.apply').on("click", function(event) {
        var cellId = findContainingCell(this);
        updateBaseComponentContentsAndDisplayAt(cellId);
        $('.tooltip').removeClass('open');
    });

    var align_options = ['alignment', 'center', 'right', 'left', 'justify'];
    var label_sizes = ['size', 'small', 'default', 'large', 'heading'];
    var label_styles = ['style', 'muted', 'default', 'primary', 'info', 'success', 'warning', 'danger'];
    var btn_styles = ['style', 'link', 'default', 'primary', 'info', 'success', 'warning', 'danger'];
    var btn_sizes = ['size', 'xs', 'df', 'lg'];
    var tab_styles = ['style', 'pills', 'tabs'];
    var tab_alignments = ['alignment', 'stacked', 'horizontal'];
    var menu_alignments = ['alignment', 'vertical', 'horizontal'];
    var panel_styles = ['style', 'default', 'primary', 'info', 'success', 'warning', 'danger'];

    function registerPropHandlers(optionsList_, classPrefix, bootstrapPrefix) {
        var propertyName = optionsList_[0];
        var optionsList = optionsList_.slice(1);

        for (var i=0; i<optionsList.length; i++) {
            var options = document.getElementsByClassName(classPrefix+'-'+optionsList[i]);
            for (var j=0; j<options.length; j++) {
                options[j].onclick = generateHandler(i, optionsList, bootstrapPrefix, propertyName);
            }
        }
    }

    function generateHandler(index, optionsList, bootstrapPrefix, propertyName) {
        return function(e) {
            e.preventDefault();
            var cellId = findContainingCell(this);
            var element = $('#'+cellId).find('.display-component');
            var bootstrapClass = bootstrapPrefix+"-"+optionsList[index];
            element.addClass(bootstrapClass);

            for (var j=0; j<optionsList.length; j++) {
                if (j!==index) {
                    element.removeClass(bootstrapPrefix+'-'+optionsList[j]);
                }
            }

            var rowcol = getRowColFromId(cellId);
            var row = rowcol.row;
            var col = rowcol.col;
            selectedUserComponent.components[row][col].properties[propertyName] = bootstrapClass;

        }
    }

    var inputOptions = [
        [align_options, 'align', 'text'],
        [label_sizes, 'lbl', 'lbl'],
        [label_styles, 'lbl-text', 'text'],
        [btn_styles, 'btn-style', 'btn'],
        [btn_sizes, 'btn-size', 'btn'],
        [tab_styles, 'tab-style', 'nav'],
        [tab_alignments, 'tab-align', 'nav'],
        [menu_alignments, 'menu', 'btn-group'],
        [panel_styles, 'panel-text', 'panel']];

    inputOptions.forEach(function(inputOption) {
        registerPropHandlers.apply(null, inputOption);
    });

    getEdits();

    var dropzones = document.getElementsByClassName("upload-drop-zone");
    for (var i=0; i<dropzones.length; i++) {
        dropzones[i].addEventListener("dragover", FileDragHover, false);
        dropzones[i].addEventListener("dragleave", FileDragHover, false);
        dropzones[i].addEventListener("drop", FileSelectHandler, false);
    }
}

function findContainingCell(context) {
    var parent = $(context).parent();
    var tagName = parent.get(0).tagName;
    while (tagName !== 'TD') {
        parent = $(parent).parent();
        tagName = parent.get(0).tagName;
    }
    var cellId = $(parent).attr('id');
    return cellId;
}

function getEdits() {
    $('[contenteditable=true]').blur(function() {
        var cellId = findContainingCell(this);
        updateBaseComponentContentsAndDisplayAt(cellId);
        getEdits();
    });
}


function selectText(container) {
    var range = document.createRange();
    range.selectNodeContents(container);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
}

/**
 * Click outside the tooltip to hide it
 */
$(document).click(function(event) {
    if(!$(event.target).closest('.tooltip').length &&
        !$(event.target).is('.tooltip') &&
        !$(event.target).is('.edit-btn') &&
        !$(event.target).is('.glyphicon')) {
        if($('.tooltip').hasClass('open')) {
            $('.tooltip').removeClass('open');
        }
    }
    // also listen for clicks in contenteditables
    if ($(event.target).is('[contenteditable=true]')) {
        selectText($(event.target).get(0));
    }

});

/**
 * Display name of uploaded image
 */
$(document).on('change', '#fileselect', function(evt) {
    files = $(this).get(0).files;
    $(this).parent().parent().parent().children().first().val(files[0].name);
});


/** ** ** ** ** ** ** ** Show Cliche Components in List  ** ** ** ** ** ** ** **/
function showClicheInList(id, name){
    var addedCliche = '<li id="added_'+id+'">'+name+'</li>';
    $('.cliche-components ul').append(addedCliche);
}