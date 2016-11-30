/**
 * Created by Shinjini on 11/3/2016.
 */

var zoom = ZoomElement();


/** ** ** ** ** ** Menu Event Handlers ** ** ** ** ** **/
// TODO on user component name input check for special chars

$('#new-user-component-btn').click(function(){
    $('#create-component').unbind();
    $('#create-component').on('click', function () {
        selectedUserComponent = initUserComponent(false, false);
        selectedProject.addComponent(selectedUserComponent);
        displayUserComponentInListAndSelect(selectedUserComponent.meta.name, selectedUserComponent.meta.id);
        workSurface.setUpEmptyWorkSurface(selectedUserComponent, 1);
        resetMenuOptions();
    });
});

$('#new-main-component-btn').click(function(){
    $('#create-component').unbind();
    $('#create-component').on('click', function () {
        selectedUserComponent = initUserComponent(false, true);
        selectedProject.addMainPage(selectedUserComponent);
        displayMainPageInListAndSelect(selectedUserComponent.meta.name, selectedUserComponent.meta.id);

        workSurface.setUpEmptyWorkSurface(selectedUserComponent, 1);

        resetMenuOptions();
    });
});



$('#save-project').on('click', function () {
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
    saveObjectToFile(projectsSavePath, projectNameToFilename(selectedProject.meta.name), selectedProject);
    //downloadObject(selectedProject.meta.name+'.json', selectedProject);
});

$('.components').on('click', '.component-name-container', function () {
    // Save the current values
    var oldState = {zoom : currentZoom,
    };
    $('#work-surface'+'_'+selectedUserComponent.meta.id).data('state', oldState);

    var componentId = $(this).parent().data('componentid');
    $('.selected').removeClass('selected');
    $(this).parent().addClass('selected');
    selectedUserComponent = selectedProject.components[componentId];
    workSurface.loadUserComponent(selectedUserComponent);
    setUpStyleColors();
});

$('.components').on('dblclick', '.component-name', function (e) {
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
        var componentId = $(this).parent().parent().parent().data('componentid');
        var componentNameElt = $($(this).parent().parent().find('.component-name'));
        var submitRenameElt = $($(this).parent().parent().find('.submit-rename'));

        componentNameElt.removeClass('not-displayed');
        submitRenameElt.addClass('not-displayed');
        var newName = $(this).val();
        if (newName.length === 0) { // empty string entered, don't change the name!
            return;
        }
        componentNameElt.text(newName);
        $('.component-options .component-name').text(newName);

        selectedProject.components[componentId].meta.name = newName;
    }
});

/** ** ** ** ** ** ** ** ** ** ** ** Component Options ** ** ** ** ** ** ** ** ** ** ** ** **/
function setComponentOptions(component){
    // renaming

    $('.component-options .component-name')
        .text(component.meta.name)
        .unbind()
        .on('dblclick', function () {
            var newNameInputElt = $($(this).parent().find('.new-name-input'));
            var submitRenameElt = $($(this).parent().find('.submit-rename'));
            newNameInputElt.val($(this).text());
            submitRenameElt.removeClass('not-displayed');
            $(this).addClass('not-displayed');
            newNameInputElt.focus();
            newNameInputElt.select();
        });

    $('.component-options .new-name-input')
        .unbind()
        .on('keypress' , function (event) {
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
                $('.components').find('[data-componentid='+component.meta.id+']').find('.component-name').text(newName);

                componentNameElt.text($(this).val());

                component.meta.name = $(this).val();
            }
        });

    // copy
    $('.component-options #btn-duplicate-component')
        .unbind()
        .click(function(){
            var copyComponent = duplicateUserComponent(component);
            var originalId = copyComponent.meta.id;
            // change the id
            copyComponent.meta.id = generateId();

            if (originalId in selectedProject.mainComponents){
                selectedProject.addMainPage(copyComponent);
                displayMainPageInListAndSelect(copyComponent.meta.name, copyComponent.meta.id);
            } else {
                displayUserComponentInListAndSelect(copyComponent.meta.name, copyComponent.meta.id);
            }

            selectedProject.addComponent(copyComponent);
            selectedUserComponent = copyComponent;
            workSurface.loadUserComponent(copyComponent, 1);

        });

    $('.component-options #btn-download-component').unbind().on('click', function(){
        downloadHTML();
    });

    // clear all
    $('.component-options #btn-clear-all')
        .unbind()
        .on("click", function (e) {
            clearAll();
        });

    // delete
    $('.component-options .btn-delete-component')
        .unbind()
        .on("click", function (e) {
            var id = component.meta.id;
            if (confirmOnUserComponentDelete){
                if (selectedProject.numComponents === 1){
                    return; //don't delete the last one TODO is the the right way to go?
                }
                openDeleteUserComponentConfirmDialogue(id);
            } else {
                deleteUserComponent(id);
            }
        });

    // if the component is in the main pages, set it up accordingly
    if (component.meta.id in selectedProject.mainComponents){
        $('.component-options #btn-index-page-toggle').css({
            display: 'inline-block',
        });
        setUpComponentOptionsIndexPageToggle(component);
    } else {
        $('.component-options #btn-index-page-toggle').css({
            display: 'none',
        })
    }


}

function setUpComponentOptionsIndexPageToggle(component){
    if (component.meta.id == selectedProject.mainComponents.indexId){
        $('.component-options #btn-index-page-toggle').find('.glyphicon').removeClass('glyphicon-plus').addClass('glyphicon-remove');
        $('.component-options #btn-index-page-toggle').find('.text').text('Unassign as Index Page');
        $('.components').find('[data-componentid='+component.meta.id+']').addClass('selected-index-page');

        $('.component-options #btn-index-page-toggle').unbind().click(function(){
            $(this).find('.glyphicon').removeClass('glyphicon-remove').addClass('glyphicon-plus');
            $(this).find('.text').text('Assign as Index Page');
            $('.components').find('[data-componentid='+component.meta.id+']').find('.index-page-toggle').trigger('click');
        });
    } else {
        $('.component-options #btn-index-page-toggle').find('.glyphicon').removeClass('glyphicon-remove').addClass('glyphicon-plus');
        $('.component-options #btn-index-page-toggle').find('.text').text('Assign as Index Page');
        $('.component-options #btn-index-page-toggle').unbind().click(function(){
            $(this).find('.glyphicon').removeClass('glyphicon-plus').addClass('glyphicon-remove');
            $(this).find('.text').text('Unassign as Index Page');
            $('.components').find('[data-componentid='+component.meta.id+']').find('.index-page-toggle').trigger('click');
        });

    }
}

/** ** ** ** ** ** Component Adding to Project and display helpers ** ** ** ** ** ** ** ** ** **/

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
    // TODO changes in style
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
    registerUserComponentAsDraggable(id);
}


/**
 * Adds a component to the list of main pages
 * @param newComponent
 */
function displayNewComponentInMainPagesList(name, id){
    // TODO changes in style
    var newComponentElt =
        '<li data-componentid=' + id + '>'
        + '<div class="component-name-container">'
        + '<div class="component-name">' + name + '</div>'
        + '<div class="submit-rename not-displayed">'
        + '<input type="text" class="new-name-input form-control" autofocus>'
        + '</div>'
        + '</div>'
        + '<div class="index-page-toggle">'
        + '</div>'
        + '</li>';
    $('#main-pages-list').append(newComponentElt);
    addDeleteUserComponentButton(id);
    registerUserComponentAsDraggable(id);
}

function displayMainPageInListAndSelect(name, id){
    $('.selected').removeClass("selected");
    displayNewComponentInMainPagesList(name,id);
    $("#main-pages-list").find("[data-componentid='" + id + "']").addClass('selected');
}

function deleteComponentFromView(containerId) {
    var cell = $('#'+containerId);
    cell.remove();
}


/**
 * Updates the contents of a base component info at a particular cell based on inputs
 * @param cellId
 */
function updateBaseComponentContentsAndDisplayAt(containerId) {
    // NOTE: actual cell is the cell in the main table
    // cellId could be either display-cell or the actual cell id, but it is the one
    // that contains text edits
    // tooltip is the tooltip currently being edited

    var container = $('#'+containerId);
    var tooltip = container.find('.tooltip');
    var componentId = container.data('componentId');

    var type = container.find('.draggable').attr('name');
    var value;
    var isUpload = false;

    if (tooltip.length>0){
        var inputs = Array.prototype.slice.call(
            tooltip.get(0).getElementsByTagName('input'), 0);
    } // TODO // else it is label and is handled

    if (type === 'label') {
        value = container.find('p')[0].textContent;
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
                    refreshContainerDisplay(container.attr('id'), currentZoom);
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
        selectedUserComponent.components[componentId].components = {};
        selectedUserComponent.components[componentId].components[type] = value;

        refreshContainerDisplay(container.attr('id'), currentZoom);
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
    var x = [];
    for (var sheetnum =0; sheetnum< document.styleSheets.length; sheetnum++){
        x = x.concat([].slice.call(document.styleSheets[sheetnum].cssRules));
    }
    return x.filter(function (rule) {
        return rule.selectorText === search;
    })[0];
}

function resizeLabelDivs(cellWidth, cellHeight) {
    getCSSRule('.label-container').style.setProperty('width', (cellWidth - 10) + 'px', null);
    getCSSRule('.label-container').style.setProperty('height', (cellHeight - 30) + 'px', null);
    getCSSRule('.label-container').style.setProperty('padding-top', (cellHeight / 4) + 'px', null);
}



/** ** ** ** ** ** ** ** ** Table Cells Interaction and display Helpers ** ** ** ** ** ** ** ** **/



function registerDraggable(widgetToRegister) {

    var draggableOptions = {
        opacity: 1,
        revert: "invalid",
        cursorAt: { top: 0, left: 0 },
        helper: function(e, ui){
            var widget = $(this);
            var offsetFromMouse = { top: 0, left: 0 };
            if (widget.hasClass('associated')){
                var componentId = widget.data('componentId');
                draggingComponent = selectedUserComponent.components[componentId];
                // keep the old one for now, for guidance and all
                var componentContainerOld = $('#component-container_'+componentId);
                componentContainerOld.css({
                    opacity: .3,
                });
                var componentContainer = componentContainerOld.clone();
                offsetFromMouse = {
                    top: e.pageY - componentContainerOld.offset().top,
                    left: e.pageX - componentContainerOld.offset().left
                };


            } else {
                var type = $(this).attr('name');
                var component = BaseComponent(type, {}, view.getDimensions(type));
                draggingComponent = component;

                var componentContainer = componentContainerMaker.createComponentContainer(component, currentZoom);
                componentContainerMaker.setUpContainer(componentContainer, widget, component, currentZoom);
                $('#basic-components').html(basicComponents);
                registerDraggable();
            }

            $('#outer-container').append(componentContainer);
            $(this).draggable( "option", "cursorAt", offsetFromMouse );

            //Hack to append the widget to the html (visible above others divs), but still belonging to the scrollable container
            // componentContainer.hide();
            // setTimeout(function(){
            //     componentContainer.appendTo('html');
            //     componentContainer.show();
            // },1);
            componentContainer.attr('id', 'dragging-container');
            componentContainer.css('position', 'absolute');

            return componentContainer;

        },
        appendTo: 'html',
        cursor: '-webkit-grabbing',
        scroll: true,
        snap: '.grid-cell',
        snapTolerance: 10,
        start: function(){
            $('.grid').css({
                visibility: 'visible'
            });
        },
        drag: function(event, ui){

        },
        stop: function(event, ui){
            $('.grid').css({
                visibility: 'hidden'
            });

            var componentId = draggingComponent.meta.id;
            var isNewComponent = $(ui.helper).data('newcomponent');
            if (!isNewComponent){
                var componentContainerOld = $('#component-container_'+componentId);
                if (!$(ui.helper).data('dropped')){// not properly dropped!
                    componentContainerOld.css({
                        opacity: 1,
                    });
                } else { // properly dropped
                    componentContainerOld.remove();
                }
            }

        }
    };

    if (widgetToRegister){
        widgetToRegister.draggable(draggableOptions)
    }

    else {
        $('.widget').each(function() {
            $(this).draggable(draggableOptions);
        });
    }

}


/**
 * Register listener for click on edit button
 * @param container
 * @param popup
 */
function triggerEdit(container, popup) {
    var type = container.find('.widget').attr('name').toLowerCase();
    var editDialog = $('#'+type+'-popup-holder').clone();

    if (!(type == 'label')){

        container.prepend(editDialog);


        $(Array.prototype.slice.call(
            container.find('form-control'), 0)[0]).trigger("focus");

        if (popup){
            setTimeout(function(){
                $(container.find('form-control')[0]).trigger("focus");
                editDialog.find('.tooltip').addClass('open');
            }, 1);
        }
    }
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
            var componentId = getComponentIdFromContainerId(cellId);
            selectedUserComponent.components[componentId].properties.bsClasses[propertyName] = bootstrapClass;

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

    getContentEditableEdits();

    var dropzones = document.getElementsByClassName("upload-drop-zone");
    for (var i=0; i<dropzones.length; i++) {
        dropzones[i].addEventListener("dragover", FileDragHover, false);
        dropzones[i].addEventListener("dragleave", FileDragHover, false);
        dropzones[i].addEventListener("drop", FileSelectHandler, false);
    }
}


// TODO needs to be updated to use more relevant classes
function findContainingCell(context) {
    var parent = $(context).parent();

    while (!(parent.hasClass('component-container'))) {
        parent = $(parent).parent();
        if (parent.length == 0){ // TODO this is a check to see if anything went awry
            console.log('something went wrong');
            console.log(context);
            return null
        }
    }
    var cellId;
    if (parent.hasClass('display-cell-parent')){
        cellId = 'display-cell';
    } else {
        cellId = $(parent).attr('id');
    }
    return cellId;
}


/**
 */
function getContentEditableEdits() {
    $('[contenteditable=true]').unbind() // unbind to prevent this from firing multiple times
        .blur(function() {
            var cellId = findContainingCell(this);
            updateBaseComponentContentsAndDisplayAt(cellId);
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
 * display name of uploaded image
 */
$(document).on('change', '#fileselect', function(evt) {
    files = $(this).get(0).files;
    $(this).parent().parent().parent().children().first().val(files[0].name);
});

/** ** ** ** ** ** Dragging and Dropping User Components to Main pages ** ** ** **/
function registerUserComponentAreaDroppable(){
    var enableDrop = {
        accept: ".dragging-component",
        hoverClass: "highlight",
        tolerance: "intersect",
        drop: function(event, ui) {
            var userComponentId = ui.draggable.data('componentid');
            var name = selectedProject.components[userComponentId].meta.name;
            if ($(this).hasClass('main-pages')){
                if (ui.draggable.hasClass('moving-user-component')){ // if type user
                    // adding to main page
                    selectedProject.addMainPage(selectedProject.components[userComponentId]);
                    $("#user-components-list").find("[data-componentid='" + userComponentId + "']").remove();
                    displayMainPageInListAndSelect(name, userComponentId);
                }
            } else if ($(this).hasClass('user-components')){
                if (ui.draggable.hasClass('moving-main-component')){ // if type user
                    // removing from main page
                    selectedProject.removeMainPage(selectedProject.components[userComponentId]);
                    $("#main-pages-list").find("[data-componentid='" + userComponentId + "']").remove();
                    displayUserComponentInListAndSelect(name, userComponentId);

                }
            }
        },
    };
    $('.page-component-toggle-drop').each(function() {
        $(this).droppable(enableDrop);
    });
}

function registerUserComponentAsDraggable(componentId) {
    var enableDraggable = function (element, type) {
        // type === 'user'||'main'
        return {
            opacity: 1,
            revert: "invalid",
            cursorAt: {top: 0, left: 0},
            helper: function () {
                $(this).addClass('dragging-component moving-' + type + '-component');
                var clone = document.createElement('div');
                // TODO display
                clone.innerHTML = $(this).find('.component-name').text();
                return clone;
            },
            appendTo: '#user-components-list',
            containment: '.user-made-components',
            cursor: '-webkit-grabbing',
            scroll: true,
            stop: function () {
                $(this).removeClass('dragging-component moving-' + type + '-component');
            }
        }

    };

    $("#user-components-list").find("[data-componentid='" + componentId + "']").each(function () {
        $(this).draggable(enableDraggable(this, 'user'));
    });
    $("#main-pages-list").find("[data-componentid='" + componentId + "']").each(function () {
        $(this).draggable(enableDraggable(this, 'main'));
    });
}

/** ** ** ** ** ** ** ** Dropdown Implementation ** ** ** ** ** ** ** ** ** **/
$(".dropdown-trigger").click(function(ev) {
    var dropdownid = $(this).data('dropdownid');

    if ($(this).hasClass('dropdown-open')){
        // close it
        $(this).removeClass('dropdown-open').addClass('dropdown-closed');
        $(this).find('.glyphicon').remove();
        $(this).append('<span class="glyphicon glyphicon-triangle-right"></span>');

        $("html").find("[data-dropdownid='" + dropdownid + "']").each(function(){
            if ($(this).hasClass('dropdown-target')){
                $(this).css({
                    display: 'none',
                });
            }
        });

    } else {
        // open it
        $(this).removeClass('dropdown-closed').addClass('dropdown-open');
        $(this).find('.glyphicon').remove();
        $(this).append('<span class="glyphicon glyphicon-triangle-bottom"></span>');

        $("html").find("[data-dropdownid='" + dropdownid + "']").each(function(){
            if ($(this).hasClass('dropdown-target')){
                $(this).css({
                    display: 'block',
                });
            }
        });

    }
});

$('.components').on('click', '.index-page-toggle', function(){
    var turnOn = !($(this).parent().hasClass('selected-index-page'));
    $('.components .selected-index-page').removeClass('selected-index-page');
    var componentId = $(this).parent().data('componentid');
    if (turnOn){
        selectedProject.mainComponents.indexId = componentId;
        $(this).parent().addClass('selected-index-page');
    } else {
        selectedProject.mainComponents.indexId = null;
    }
    setUpComponentOptionsIndexPageToggle(selectedProject.components[componentId]);
});


function refreshContainerDisplay(containerId, zoom){
    if (!zoom){
        zoom = 1;
    }
    var container =  $('#'+containerId);
    var componentId = container.data('componentId');

    if (selectedUserComponent.components[componentId]){
        var componentToChange = selectedUserComponent.components[componentId];

        view.removeDisplay(container);
        var properties = componentToChange.properties;

        // display itself gets rid of padding for the #display-cell
        view.displayInnerComponent(container, componentToChange.type, view.getHTML(componentToChange.type)(componentToChange.components[componentToChange.type]), zoom, properties);
        //attach event handlers to new texts
        registerTooltipBtnHandlers();
    } else {
        deleteComponentFromView(containerId);
    }

}


/**
 * Disabled by changing the id and class names
 * @param componentId
 */
function disableComponentDOMElements(componentId){
    var workSurface = $('#work-surface'+'_'+componentId);
    $(workSurface).addClass('hidden-component');

    $(workSurface).find('*').each(function() {
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
    var workSurface = $('#work-surface'+'_'+componentId);
    $(workSurface).removeClass('hidden-component');

    $(workSurface).find('*').each(function() {
        var id = this.id;
        if (id.length>0){
            this.id = id.replace('disabled_'+componentId+'_', '');
        }
        var classes = this.className;
        if (classes.length>0){
            classes = classes.split(' ');
            var classNames = '';
            classes.forEach(function(className){
                classNames =  classNames  + ' ' +  className.replace('disabled_'+componentId+'_', '');
            });
            this.className = classNames.trim();
        }
    });
}

function disableAllComponentDomElementsExcept(componentToEnableId){
    for (var componentId in selectedProject.components){
        if (componentToEnableId == componentId){
            enableComponentDOMElements(componentId);
            continue;
        }
        if ($('#work-surface'+'_'+componentId).hasClass('hidden-component')){
            continue;
        }
        disableComponentDOMElements(componentId);
    }
}

function enableSpecificComponentDomElements(componentToEnableId){
    // first check that the table has been made (otherwise the reset will happen automatically,
    // but more importantly, the table-grid-container won't exist yet
    var workSurfaceToEnable = $('#work-surface'+'_'+componentToEnableId);
    if (!(workSurfaceToEnable.length>0)) {
        createOrResetTableGridContainer(componentToEnableId);
        var state = {
            zoom: 1,
            lock:{
                width: false,
                height: false
            }
        };
        $('#work-surface'+'_'+componentToEnableId).data('state', state);
    }

    var componentToEnable = selectedProject.components[componentToEnableId];

    // enable first (toggle needs the id's and classes to be enabled)
    if (workSurfaceToEnable.hasClass('hidden-component')){
        enableComponentDOMElements(componentToEnableId);
    }

    zoom.updateZoomFromState(componentToEnableId);

    setComponentOptions(componentToEnable);

}

function setUpGrid(){
    $('.grid').remove();
    var workSurface = $('#work-surface_'+selectedUserComponent.meta.id);

    var grid = {x: {}, y:{}};
    for (var componentId in selectedUserComponent.components){
        // existing components should also be in the work surface!
        var container = $('#component-container_'+componentId);
        var top = container.position().top;
        var left = container.position().left;
        var right = left + container.width();
        var bottom = top + container.height();
        grid.x[left] = '';
        grid.x[right] = '';
        grid.y[top] = '';
        grid.y[bottom] = '';
    }
    var xs = Object.keys(grid.x).map(function(key){
        return parseFloat(key);
    });

    // var top = workSurface.offset().top;
    var top = 0;
    var bottom = top + workSurface.height();
    // var left = workSurface.offset().left;
    var left = 0;
    var right = left + workSurface.width();

    xs.push(left);
    xs.push(right);
    xs.sort(function(a, b){
        return a-b;
    });

    var ys = Object.keys(grid.y).map(function(key){
        return parseFloat(key);
    });
    ys.push(top);
    ys.push(bottom);
    ys.sort(function(a, b){
        return a-b;
    });

    var numRows = ys.length-1;
    var numCols = xs.length-1;

    var gridElt = $('<div></div>');
    gridElt.addClass('grid');
    for (var col=0; col<numCols; col++){
        var colElt = $('<div></div>');
        colElt.addClass('grid-col');
        gridElt.append(colElt);

        for (var row=0; row<numRows; row++){
            var cellElt = $('<div></div>');
            cellElt.addClass('grid-cell');
            cellElt.attr('id', 'grid-cell_'+row+'_'+col);
            colElt.append(cellElt);
            cellElt.css({
                width: xs[col+1] - xs[col],
                height: ys[row+1] - ys[row],
            });
        }
    }
    gridElt.css({
        position: 'absolute',
        // top: ys[0] - workSurface.offset().top,
        // left: xs[0] - workSurface.offset().left,
        top: 0,
        left: 0,
        width: 1.1*(xs[numCols] - xs[0]),
        visibility: 'hidden',
    });
    workSurface.append(gridElt);
    // $('body').append(gridElt);
    $('.grid-col').css({
        display: 'inline-block'
    });
    $('.grid-cell').css({
        display: 'block',
        border: '1px dashed grey'
    });
};





/************************************************************/
function testSaveHTML(){
    var html = '';
    $('.component-container').each(function(){
        var displayComponent = $(this).find('.display-component');
        if (displayComponent.get(0)){
            html = html + displayComponent.get(0).outerHTML+'/n';
        }
    });
    return html;
}

function createDownloadPreview(){
    var oldZoom = currentZoom;
    var workSurface = $('#work-surface_'+selectedUserComponent.meta.id);
    currentZoom = 1;
    propagateRatioChangeToAllElts(currentZoom);

    $('#download-preview-area').html('').css({
        position: 'relative',
        'text-align': 'center',
        margin: 'auto',
        width: workSurface.css('width'),
        height: workSurface.css('height'),
        'background-color': workSurface.css('background-color'),
    });

    $('.component-container').each(function(){
        var add = false;
        var css = {
            position: 'absolute',
            top: $(this).position().top,
            left: $(this).position().left,
            width: $(this).width()+'px',
            height: $(this).height()+'px',
            'vertical-align': 'middle',
        };
        var container = $('<div></div>');
        container.css(css);

        var labelContainer = $(this).find('.label-container').clone(true, true);
        if (labelContainer.get(0)){
            labelContainer.css({// this is not carried over, since this was declared in the css file
                position: 'absolute',
                top: '0',
                display: 'block',
            });
            container.append(labelContainer);
            var displayComponent = labelContainer.find('.display-component');
            displayComponent.css({// this is not carried over, since this was declared in the css file
                'white-space': 'initial',
                margin: 0,
            });
            displayComponent.attr('contenteditable', false);
            add = true;
        } else {
            var displayComponent = $(this).find('.display-component').clone(true, true);
            displayComponent.css({// this is not carried over, since this was declared in the css file
                'white-space': 'initial',
            });
            if (displayComponent.get(0)){
                container.append(displayComponent);
                add = true;
            }
        }
        if (add){
            $('#download-preview-area').append(container);
        }
    });

    currentZoom = oldZoom;
    propagateRatioChangeToAllElts(currentZoom);

    return $('#download-preview-area-container').html();
}

function downloadHTML(){
    var innerHTML = createDownloadPreview();
    var stylesheets = '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">';
    var js = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>'+
        '<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>';
    var HTML = '<!doctype html><html>'+stylesheets+'<head></head><body>'+innerHTML+js+'</body></html>';
    var element = document.createElement('a');
    var data = "data:text/html;charset=utf-8," + encodeURIComponent(HTML);

    element.setAttribute('href', data);
    element.setAttribute('download', selectedUserComponent.meta.name+'.html');

    element.click();

}

/**
 * Deletes a component from the datatype and also from the view
 */
function deleteComponentFromUserComponentAndFromView(componentId) {
    var containerId = "component-container_"+componentId;
    selectedUserComponent.deleteComponent(componentId);
    deleteComponentFromView(containerId);
}
