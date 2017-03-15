/**
 * Created by Shinjini on 11/3/2016.
 */

/** ** ** ** ** ** Menu Event Handlers ** ** ** ** ** **/
// TODO on user component name input check for special chars

$('#new-user-datatype-btn').click(function(){
    $('#create-component').unbind()
        .on('click', function () {
            var name = sanitizeStringOfSpecialChars($('#new-component-name').val());
            var datatypeInfo = initDatatype();
            var datatype = datatypeInfo[0];
            var datatypeDisplayProps = datatypeInfo[1];
            userApp.addDatatype(datatype, datatypeDisplayProps);
            selectedProject.addDataBondDisplay(userApp.meta.id, datatype.meta.id);
            displayNewDatatypeInUserDatatypeList(datatype.meta.name, datatype.meta.id, userApp.meta.id);
            // dataWorkSurface.setUpEmptyWorkSurface(datatype, 1);
            // TODO add to overall and to userApp display
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
    var oldState = {zoom : currentZoom};
    var workSurfaceRef = dataWorkSurface.getWorkSurfaceRef();
    $('#'+workSurfaceRef+'_'+userApp.meta.id).data('state', oldState);

    var widgetId = $(this).parent().data('componentid');
    $('.selected').removeClass('selected');
    $(this).parent().addClass('selected');
    dataWorkSurface.loadDatatype(userApp, null);
    $('#outer-container').scrollTop(0); // TODO DRY
    $('#outer-container').scrollLeft(0);
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
        var widgetId = $(this).parent().parent().parent().data('componentid');
        var widgetNameElt = $($(this).parent().parent().find('.component-name'));
        var submitRenameElt = $($(this).parent().parent().find('.submit-rename'));

        widgetNameElt.removeClass('not-displayed');
        submitRenameElt.addClass('not-displayed');
        var newName = $(this).val();
        if (newName.length === 0) { // empty string entered, don't change the name!
            return;
        }
        widgetNameElt.text(newName);
        $('.component-options .component-name').text(newName);

        selectedProject.cliches[widgetId].meta.name = newName;
    }
});

/** ** ** ** ** ** ** ** ** ** ** ** Component Options ** ** ** ** ** ** ** ** ** ** ** ** **/
function setDatatypeOptions(outerWidget){
    // renaming

    $('.component-options .component-name')
        .text(outerWidget.meta.name)
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
                var widgetNameElt = $($(this).parent().parent().find('.component-name'));
                var submitRenameElt = $($(this).parent().parent().find('.submit-rename'));

                widgetNameElt.removeClass('not-displayed');
                submitRenameElt.addClass('not-displayed');

                var newName = $(this).val();
                if (newName.length === 0) { // empty string entered, don't change the name!
                    return;
                }
                $('.components').find('[data-componentid='+outerWidget.meta.id+']').find('.component-name').text(newName);

                widgetNameElt.text($(this).val());

                outerWidget.meta.name = $(this).val();
            }
        });

    // copy
    $('.component-options #btn-duplicate-component')
        .unbind()
        .click(function(){
            var copyWidget = duplicateUserWidget(outerWidget);
            var originalId = copyWidget.meta.id;
            // change the id
            copyWidget.meta.id = generateId();

            if (originalId in selectedProject.userApp){
                selectedProject.addPage(copyWidget);
                displayMainPageInListAndSelect(copyWidget.meta.name, copyWidget.meta.id);
            } else {
                displayUserWidgetInListAndSelect(copyWidget.meta.name, copyWidget.meta.id);
            }

            selectedProject.addCliche(copyWidget);
            selectedUserWidget = copyWidget;
            dataWorkSurface.loadUserWidget(copyWidget, 1);

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
            var id = outerWidget.meta.id;
            if (confirmOnUserWidgetDelete){
                if (selectedProject.numComponents === 1){
                    return; //don't delete the last one TODO is the the right way to go?
                }
                openDeleteUserWidgetConfirmDialogue(id);
            } else {
                deleteUserWidget(id);
            }
        });

    // if the component is in the main pages, set it up accordingly
    if (outerWidget.meta.id == selectedProject.userApp){
        $('.component-options #btn-index-page-toggle').css({
            display: 'inline-block',
        });
        setUpWidgetOptionsIndexPageToggle(outerWidget);
    } else {
        $('.component-options #btn-index-page-toggle').css({
            display: 'none',
        })
    }


}

function setUpWidgetOptionsIndexPageToggle(outerWidget){
    if (outerWidget.meta.id == selectedProject.userApp.indexId){
        $('.component-options #btn-index-page-toggle').find('.glyphicon').removeClass('glyphicon-plus').addClass('glyphicon-remove');
        $('.component-options #btn-index-page-toggle').find('.text').text('Unassign as Index Page');
        $('.components').find('[data-componentid='+outerWidget.meta.id+']').addClass('selected-index-page');

        $('.component-options #btn-index-page-toggle').unbind().click(function(){
            $(this).find('.glyphicon').removeClass('glyphicon-remove').addClass('glyphicon-plus');
            $(this).find('.text').text('Assign as Index Page');
            $('.components').find('[data-componentid='+outerWidget.meta.id+']').find('.index-page-toggle').trigger('click');
        });
    } else {
        $('.component-options #btn-index-page-toggle').find('.glyphicon').removeClass('glyphicon-remove').addClass('glyphicon-plus');
        $('.component-options #btn-index-page-toggle').find('.text').text('Assign as Index Page');
        $('.component-options #btn-index-page-toggle').unbind().click(function(){
            $(this).find('.glyphicon').removeClass('glyphicon-plus').addClass('glyphicon-remove');
            $(this).find('.text').text('Unassign as Index Page');
            $('.components').find('[data-componentid='+outerWidget.meta.id+']').find('.index-page-toggle').trigger('click');
        });

    }
}

/** ** ** ** ** ** Component Adding to Project and display helpers ** ** ** ** ** ** ** ** ** **/

function displayDatatypeInListAndSelect(name, id, clicheId){
    $('.selected').removeClass("selected");
    displayNewDatatypeInUserDatatypeList(name,id, clicheId);
    $("#user-components-list").find("[data-componentid='" + id + "']").addClass('selected');
}


/**
 * Adds a component to the list of user components
 * @param newComponent
 */
function displayNewClicheInList(cliche){
    // TODO changes in style
    var dropdownId = cliche.meta.id+'_datatypes';
    var newClicheElt = $(
        '<div class="user-components page-component-toggle-drop">'+
        '<div class="header">'+
        '<span class="dropdown-trigger dropdown-open" data-dropdownid="'+dropdownId+'">'+
        '<span class="glyphicon glyphicon-triangle-bottom"></span>'+
        cliche.meta.name+
        '</span>'+
        //'<button type="button" class="btn btn-default" data-toggle="modal" data-target="#new-component" id="new-user-datatype-btn">'+
        //'<span class="glyphicon glyphicon-plus"></span>'+
        //'</button>'+
        //'<button type="button" class="btn btn-default" data-toggle="modal" data-target="#load-component">'+
        //'<span class="glyphicon glyphicon-import"></span>'+
        //'</button>'+
        '</div>'+
        '<div class="content  dropdown-target"  data-dropdownid="'+dropdownId+'">'+
        '<ul id="'+dropdownId+'-list">'+
        '</ul>'+
        '</div>'+
        '</div>');
    $('#user-components-list').append(newClicheElt);
    // addDeleteUserDatatypeButton(id);
    // registerUserWidgetAsDraggableForMainPages(id);
    // dataDragAndDrop.registerDataDragHandleDraggable(newClicheElt);
    enableDropdownTrigger();
}


/**
 * Adds a component to the list of user components
 * @param newComponent
 */
function displayNewDatatypeInUserDatatypeList(name, id, clicheId){
    // TODO changes in style
    var dropdownId = clicheId+'_datatypes-list';

    var newDatatypeElt = $(
        '<li data-type="'+'user'+'" class="datatype" data-componentid="' + id + '" data-clicheid=' + clicheId + '>'
        + '<div class="component-name-container">'
        + '<span class="component-name">' + name + '</span>'
        + '<span class="submit-rename not-displayed">'
        + '<input type="text" class="new-name-input form-control" autofocus>'
        + '</span>'
        + '</div>'
        + '</li>');
    $('#'+dropdownId).append(newDatatypeElt);
    // addDeleteUserDatatypeButton(id);
    // registerUserWidgetAsDraggableForMainPages(id);
    // dataDragAndDrop.registerDataDragHandleDraggable(newDatatypeElt);
}


/**
 * Adds a component to the list of main pages
 * @param newComponent
 */
function displayOverallDatatypesInList(name, id){
    // TODO changes in style
    var newWidgetElt =
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
    $('#main-pages-list').append(newWidgetElt);
}

function displayOverallDatatypesInListAndSelect(name, id){
    $('.selected').removeClass("selected");
    displayOverallDatatypesInList(name,id);
    $("#main-pages-list").find("[data-componentid='" + id + "']").addClass('selected');
}


/** ** ** ** ** ** ** ** ** Table Cells Interaction and display Helpers ** ** ** ** ** ** ** ** **/


/**
 * Register listener for click on edit button
 * @param container
 * @param popup
 */
function triggerEdit(container, popup) {
    if (container.find('.tooltip').length==0){
        var type = container.find('.widget').data('type').toLowerCase();
        var editDialog = $('#'+type+'-popup-holder').clone();

        if (!(type == 'label')){

            container.prepend(editDialog);

            $(Array.prototype.slice.call(
                container.find('form-control'), 0)[0]).trigger("focus");

        }
    }
    if (popup){
        setTimeout(function(){
            $(container.find('form-control')[0]).trigger("focus");
            editDialog.find('.tooltip').addClass('open');
        }, 1);
    }

}



function registerTooltipBtnHandlers() {
    $('.close').unbind().on("click", function() {
        setTimeout(function(){
            $('.tooltip').removeClass('open');
        }, 1);
        Array.prototype.slice.call(
            $(this).parent().get(0).getElementsByClassName('form-control'), 0)
            .forEach(function(item) {
                item.value = "";
            })
    });

    $('.apply').unbind().on("click", function(event) {
        var cellId = findContainingContainer(this);
        updateBaseWidgetContentsAndDisplayAt(cellId);
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
            var containerId = findContainingContainer(this);
            var element = $('#'+containerId).find('.display-component');
            var bootstrapClass = bootstrapPrefix+"-"+optionsList[index];
            element.addClass(bootstrapClass);

            for (var j=0; j<optionsList.length; j++) {
                if (j!==index) {
                    element.removeClass(bootstrapPrefix+'-'+optionsList[j]);
                }
            }
            var widgetId = getWidgetIdFromContainerId(containerId);
            selectedUserWidget.innerWidgets[widgetId].properties,style.bsClasses[propertyName] = bootstrapClass;

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
function findContainingContainer(context) {
    var parent = $(context).parent();

    while (!(parent.hasClass('component-container'))) {
        parent = $(parent).parent();
        if (parent.length == 0){ // TODO this is a check to see if anything went awry
            console.log('something went wrong');
            console.log(context);
            return null
        }
    }
    return $(parent).attr('id');
}


/**
 */
function getContentEditableEdits() {
    $('[contenteditable=true]').unbind() // unbind to prevent this from firing multiple times
        .blur(function() {
            var containerId = findContainingContainer(this);
            updateBaseWidgetContentsAndDisplayAt(containerId);
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
function registerUserWidgetAreaDroppable(){
    var enableDrop = {
        accept: ".dragging-component",
        hoverClass: "highlight",
        tolerance: "intersect",
        drop: function(event, ui) {
            var userWidgetId = ui.draggable.data('componentid');
            var name = selectedProject.cliches[userWidgetId].meta.name;
            if ($(this).hasClass('main-pages')){
                if (ui.draggable.hasClass('moving-user-component')){ // if type user
                    // adding to main page
                    selectedProject.addPage(selectedProject.cliches[userWidgetId]);
                    $("#user-components-list").find("[data-componentid='" + userWidgetId + "']").remove();
                    displayMainPageInListAndSelect(name, userWidgetId);
                }
            } else if ($(this).hasClass('user-components')){
                if (ui.draggable.hasClass('moving-main-component')){ // if type user
                    // removing from main page
                    selectedProject.deletePage(selectedProject.cliches[userWidgetId]);
                    $("#main-pages-list").find("[data-componentid='" + userWidgetId + "']").remove();
                    displayUserWidgetInListAndSelect(name, userWidgetId);

                }
            }
        },
    };
    $('.page-component-toggle-drop').each(function() {
        $(this).droppable(enableDrop);
    });
}

function registerUserWidgetAsDraggableForMainPages(widgetId) {
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

    $("#user-components-list").find("[data-componentid='" + widgetId + "']").each(function () {
        $(this).draggable(enableDraggable(this, 'user'));
    });
    $("#main-pages-list").find("[data-componentid='" + widgetId + "']").each(function () {
        $(this).draggable(enableDraggable(this, 'main'));
    });
}

/** ** ** ** ** ** ** ** Dropdown Implementation ** ** ** ** ** ** ** ** ** **/
function enableDropdownTrigger(){
    $(".dropdown-trigger").unbind().click(function(ev) {
        var dropdownid = $(this).data('dropdownid');

        if ($(this).hasClass('dropdown-open')){
            // close it
            $(this).removeClass('dropdown-open').addClass('dropdown-closed');
            $(this).find('.glyphicon').remove();
            $(this).prepend('<span class="glyphicon glyphicon-triangle-right"></span>');

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
            $(this).prepend('<span class="glyphicon glyphicon-triangle-bottom"></span>');

            $("html").find("[data-dropdownid='" + dropdownid + "']").each(function(){
                if ($(this).hasClass('dropdown-target')){
                    $(this).css({
                        display: 'block',
                    });
                }
            });

        }
    });

}

enableDropdownTrigger();

$('.components').on('click', '.index-page-toggle', function(){
    var turnOn = !($(this).parent().hasClass('selected-index-page'));
    $('.components .selected-index-page').removeClass('selected-index-page');
    var widgetId = $(this).parent().data('componentid');
    if (turnOn){
        selectedProject.userApp.indexId = widgetId;
        $(this).parent().addClass('selected-index-page');
    } else {
        selectedProject.userApp.indexId = null;
    }
    setUpWidgetOptionsIndexPageToggle(selectedProject.cliches[widgetId]);
});

function refreshContainerDisplay(fresh, container, zoom){
    if (!zoom){
        zoom = 1;
    }
    var widgetId = container.data('componentId');


    if (dataEditsManager.getPath(selectedUserWidget, widgetId)){ // component exists
        var widgetToChange = dataEditsManager.getInnerWidget(selectedUserWidget, widgetId);

        var overallStyles = dataEditsManager.getMostRelevantOverallCustomChanges(selectedUserWidget, widgetId);
        // var overallStyles = selectedUserWidget.properties.styles.custom;
        dataView.displayWidget(fresh, widgetToChange, container, overallStyles, zoom);

        //attach event handlers to new texts
        registerTooltipBtnHandlers();
    } else {
        container.remove();
    }

}

/**
 * Deletes a component from the datatype and also from the view
 */
function deleteWidgetFromUserWidgetAndFromView(widgetId) {
    var containerId = "component-container_"+widgetId;
    var parent = dataEditsManager.getInnerWidget(selectedUserWidget, widgetId, true);
    parent.deleteInnerWidget(widgetId);
    // selectedUserWidget.deleteInnerWidget(widgetId);
    $('#'+containerId).remove();
    grid.setUpGrid();
    dataMiniNav.setUpMiniNavElementAndInnerWidgetSizes(selectedUserWidget);
    dataZoomElement.registerZoom(selectedUserWidget);
}



// keyboard shortcuts
$(document).keydown(function(e){
    // Save combination
    if ((event.which == 115 && event.ctrlKey) || (event.which == 19)){
        alert("Ctrl-S pressed");
        event.preventDefault();
    }
});