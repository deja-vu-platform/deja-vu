/**
 * Created by Shinjini on 11/3/2016.
 */

/** ** ** ** ** ** Menu Event Handlers ** ** ** ** ** **/
// TODO on user component name input check for special chars

$('#new-user-component-btn').click(function(){
    $('#create-component').unbind()
        .on('click', function () {
            selectedUserWidget = initUserWidget(false, false);
            userApp.addWidget(selectedUserWidget);
            listDisplay.refresh();
            workSurface.setUpEmptyWorkSurface(selectedUserWidget, 1);
            style.setUpStyleColors(selectedUserWidget);

            resetMenuOptions();
    });
});

$('#new-main-component-btn').click(function(){
    $('#create-component').unbind()
        .on('click', function () {
            selectedUserWidget = initUserWidget(false, true);
            userApp.addPage(selectedUserWidget);
            listDisplay.refresh();
            workSurface.setUpEmptyWorkSurface(selectedUserWidget, 1);
            style.setUpStyleColors(selectedUserWidget);
            resetMenuOptions();
    });
});

$('#new-widget-template-btn').click(function(){
    $('#create-component').unbind()
        .on('click', function () {
            selectedUserWidget = initUserWidget(false, false);
            userApp.addTemplate(selectedUserWidget);
            listDisplay.refresh();
            workSurface.setUpEmptyWorkSurface(selectedUserWidget, 1);
            style.setUpStyleColors(selectedUserWidget);
            resetMenuOptions();
        });
});


$('#save-project').on('click', function () {
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
    utils.saveProject(selectedProject);
});

$('.components').on('click', '.component-name-container', function () {
    // Save the current values
    var oldState = {zoom : currentZoom};
    var workSurfaceRef = workSurface.getWorkSurfaceRef();
    $('#'+workSurfaceRef+'_'+selectedUserWidget.meta.id).data('state', oldState);
    $('.widget').each(function(idx, elt){
        elt = $(elt);
        if (elt.data('draggable')){
            elt.draggable('enable');
        }
    });
    dragAndDrop.registerWidgetDragHandleDraggable();
    var widgetId = $(this).parent().data('componentid');
    listDisplay.select(widgetId);
    //$('.selected').removeClass('selected');
    //$(this).parent().addClass('selected');
    selectedUserWidget = userApp.getWidget(widgetId);
    if (!selectedUserWidget.isPage){
        var dragHandle = $('.components').find('[data-componentid='+selectedUserWidget.meta.id+']');
        if (dragHandle.data('draggable')){
            dragHandle.draggable('disable');
        }
    }
    workSurface.loadUserWidget(selectedUserWidget);
    style.setUpStyleColors(selectedUserWidget);
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

        userApp.getWidget(widgetId).meta.name = newName;
    }
});

/** ** ** ** ** ** ** ** ** ** ** ** Component Options ** ** ** ** ** ** ** ** ** ** ** ** **/
function setWidgetOptions(outerWidget){
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
            // change the id
            copyWidget.meta.id = utils.generateId();
            listDisplay.refresh();
            userApp.addWidget(copyWidget);
            selectedUserWidget = copyWidget;
            workSurface.loadUserWidget(copyWidget, 1);

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
                if (userApp.getNumWidgets() == 1){
                    return; //don't delete the last one TODO is the the right way to go?
                }
                openDeleteUserWidgetConfirmDialogue(id);
            } else {
                deleteUserWidget(id);
            }
        });

    // if the component is in the main pages, set it up accordingly
    if (outerWidget.meta.id in userApp.widgets.pages){
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
    if (outerWidget.meta.id == userApp.widgets.indexId){
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









/**
 * Updates the contents of a base component info at a particular cell based on inputs
 * @param containerId
 */
function updateBaseWidgetContentsAndDisplayAt(containerId) {

    var container = $('#'+containerId);
    var tooltip = container.find('.tooltip');
    var widgetId = container.data('componentId');

    var type = container.find('.draggable').data('type');
    var value;
    var isUpload = false;

    var done = function(value){
        var newValue = {type: type, value: value};
        widgetEditsManager.updateCustomProperties(selectedUserWidget, widgetId, 'value', newValue);

        // selectedUserWidget.innerWidgets[widgetId].innerWidgets = {};
        // selectedUserWidget.innerWidgets[widgetId].innerWidgets[type] = value;

        refreshContainerDisplay(true, container, currentZoom);
    };

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
            console.log('trying?');

            parseFile.save()
                .then(function (savedFile) { // save was successful
                    console.log('success');
                    value.img_src = savedFile.url();
                    done(value);
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
            heading: container.find('.panel-title')[0].textContent,
            content: container.find('.panel-html')[0].textContent
        }
    }

    if (!isUpload) {
        done(value);
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
            var widgetId = widgetContainerMaker.getWidgetIdFromContainerId(containerId);
            selectedUserWidget.innerWidgets[widgetId].properties.styles.bsClasses[propertyName] = bootstrapClass;

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

    var containerRef = widgetContainerMaker.getContainerRef();

    while (!(parent.hasClass(containerRef))) {
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
// function registerUserWidgetAreaDroppable(){
//     var enableDrop = {
//         accept: ".dragging-component",
//         hoverClass: "highlight",
//         tolerance: "intersect",
//         drop: function(event, ui) {
//             var userWidgetId = ui.draggable.data('componentid');
//             var name = userApp.widgets[userWidgetId].meta.name;
//             if ($(this).hasClass('main-pages')){
//                 if (ui.draggable.hasClass('moving-user-component')){ // if type user
//                     // adding to main page
//                     userApp.addPage(userApp.widgets[userWidgetId]);
//                     $("#user-components-list").find("[data-componentid='" + userWidgetId + "']").remove();
//                     displayMainPageInListAndSelect(name, userWidgetId);
//                 }
//             } else if ($(this).hasClass('user-components')){
//                 if (ui.draggable.hasClass('moving-main-component')){ // if type user
//                     // removing from main page
//                     userApp.deletePage(userApp.widgets[userWidgetId]);
//                     $("#main-pages-list").find("[data-componentid='" + userWidgetId + "']").remove();
//                     displayUserWidgetInListAndSelect(name, userWidgetId);
//
//                 }
//             }
//         },
//     };
//     $('.page-component-toggle-drop').each(function() {
//         $(this).droppable(enableDrop);
//     });
// }

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
    var widgetId = $(this).parent().data('componentid');
    if (turnOn){
        userApp.widgets.indexId = widgetId;
        $(this).parent().addClass('selected-index-page');
    } else {
        userApp.widgets.indexId = null;
    }
    setUpWidgetOptionsIndexPageToggle(userApp.getWidget(widgetId));
});

function refreshContainerDisplay(fresh, container, zoom){
    if (!zoom){
        zoom = 1;
    }
    var widgetId = container.data('componentId');


    if (selectedUserWidget.getPath(widgetId)){ // component exists
        var widgetToChange = selectedUserWidget.getInnerWidget(widgetId);

        var overallStyles = widgetEditsManager.getMostRelevantOverallCustomChanges(selectedUserWidget, widgetId);
        // var overallStyles = selectedUserWidget.properties.styles.custom;
        view.displayWidget(fresh, widgetToChange, container, overallStyles, zoom);

        //attach event handlers to new texts
        registerTooltipBtnHandlers();
    } else {
        container.remove();
    }

}
/**
 *
 // updates the ids to a new id, also updates them in layout.stackOrder

 // source outer widget is if you already have a copy of your Widget
 // and you want the given widget (not a copy) to have the same recursive ids as that one

 *
 * @param widget
 * @param sourceWidget
 * @returns {*}
 */
function recursiveReIding(widget, sourceWidget){
    if (widget.meta){ // ie, it's not the totally inner component // TODO make this more robust
        var thisWidgetNewId;
        if (sourceWidget){
            thisWidgetNewId = sourceWidget.meta.id;
        } else {
            thisWidgetNewId = utils.generateId();
        }
        // (new Date()).getTime();  // FIXME gaaah, getTime() does not produce unique ids!
        widget.meta.id = thisWidgetNewId;
        if (widget.type == 'user'){
            for (var idx = 0; idx< widget.properties.layout.stackOrder.length; idx++){
                var innerWidgetOldId = widget.properties.layout.stackOrder[idx];
                var result;
                if (sourceWidget){
                    var oldSourceId = sourceWidget.properties.layout.stackOrder[idx];
                    result = recursiveReIding(widget.innerWidgets[innerWidgetOldId], sourceWidget.innerWidgets[oldSourceId]);
                } else {
                    result = recursiveReIding(widget.innerWidgets[innerWidgetOldId]);
                }
                if (result.success){
                    if (result.newId != innerWidgetOldId){ // or else the delete will delete the things!
                        widget.properties.layout.stackOrder[idx] = result.newId;
                        widget.innerWidgets[result.newId] = widget.innerWidgets[innerWidgetOldId];
                        delete widget.innerWidgets[innerWidgetOldId];
                        widget.properties.layout[result.newId] = widget.properties.layout[innerWidgetOldId];
                        delete widget.properties.layout[innerWidgetOldId];
                    }
                }
            }
        }
        return {success: true, newId: thisWidgetNewId};
    }
    return {success: false}
}

function createUserWidgetCopy (outerWidget, sourceOuterWidget){
    var widget = UserWidget.fromString(JSON.stringify(outerWidget));

    recursiveReIding(widget, sourceOuterWidget);
    return widget;
}




/************************************************************/
function testSaveHTML(){
    var html = '';
    $('.component-container').each(function(){
        var displayWidget = $(this).find('.display-component');
        if (displayWidget.get(0)){
            html = html + displayWidget.get(0).outerHTML+'/n';
        }
    });
    return html;
}

function createDownloadPreview(){
    // from http://stackoverflow.com/questions/754607/can-jquery-get-all-css-styles-associated-with-an-element
    var getCSSasJSON = function(elm) {
        var css2json= function(CSSFile){
            var json = {};
            if (!CSSFile) return json;
            if (CSSFile instanceof CSSStyleDeclaration) {
                for (var i in CSSFile) {
                    if ((CSSFile[i]).toLowerCase) {
                        json[(CSSFile[i]).toLowerCase()] = (CSSFile[CSSFile[i]]);
                    }
                }
            } else if (typeof CSSFile == "string") {
                CSSFile = CSSFile.split("; ");
                for (var i in CSSFile) {
                    var keyValue = CSSFile[i].split(": ");
                    json[keyValue[0].toLowerCase()] = (keyValue[1]);
                }
            }
            return json;
        };

        var sheets = document.styleSheets;
        var json = {};
        for (var i in sheets) {
            var rules = sheets[i].rules || sheets[i].cssRules;
            for (var rule in rules) {
                if (elm.is(rules[rule].selectorText)) {
                    json = $.extend(json, css2json(rules[rule].style), css2json(elm.attr('style')));
                }
            }
        }
        return json;
    };

    var oldZoom = currentZoom;
    var workSurfaceElt = $('#work-surface_'+selectedUserWidget.meta.id);
    currentZoom = 1;
    propagateRatioChangeToAllElts(currentZoom, selectedUserWidget);

    $('#download-preview-area').html('').css({
        position: 'relative',
        'text-align': 'center',
        margin: 'auto',
        width: workSurfaceElt.css('width'),
        height: workSurfaceElt.css('height'),
        'background-color': workSurfaceElt.css('background-color'),
    });

    $('.component-container').each(function(){
        var add = false;
        //var css = {
        //    position: 'absolute',
        //    top: $(this).position().top,
        //    left: $(this).position().left,
        //    width: $(this).width()+'px',
        //    height: $(this).height()+'px',
        //    'vertical-align': 'middle',
        //    //'background-color': $(this).css('background-color'),
        //};

        var container = $('<div></div>');
        container.css(getCSSasJSON($(this)));
        //container.css(css);

        var labelContainer = $(this).find('.label-container').clone(true, true);
        var displayWidget;
        if (labelContainer.get(0)){
            //labelContainer.css({// this is not carried over, since this was declared in the css file
            //    position: 'absolute',
            //    top: '0',
            //    display: 'block',
            //});
            labelContainer.css(getCSSasJSON(labelContainer));
            container.append(labelContainer);
            displayWidget = labelContainer.find('.display-component');
            //displayWidget.css({// this is not carried over, since this was declared in the css file
            //    'white-space': 'initial',
            //    margin: 0,
            //});
            displayWidget.css(getCSSasJSON(displayWidget));

            displayWidget.attr('contenteditable', false);
            add = true;
        } else {
            displayWidget = $(this).find('.display-component').clone(true, true);
            //displayWidget.css({// this is not carried over, since this was declared in the css file
            //    'white-space': 'initial',
            //});
            displayWidget.css(getCSSasJSON(displayWidget));

            if (displayWidget.get(0)){
                container.append(displayWidget);
                add = true;
            }
        }

        if (add){
            $('#download-preview-area').append(container);
        }
    });

    currentZoom = oldZoom;
    propagateRatioChangeToAllElts(currentZoom, selectedUserWidget);

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
    element.setAttribute('download', selectedUserWidget.meta.name+'.html');

    element.click();

}

var removeUserWidgetFromView = function(widgetId){
    var containerRef = widgetContainerMaker.getContainerRef();

    var containerId = containerRef+"_"+widgetId;
    $('#'+containerId).remove();
    grid.setUpGrid();
    miniNav.setUpMiniNavElementAndInnerWidgetSizes(selectedUserWidget);
    zoomElement.registerZoom(selectedUserWidget);
}

/**
 * Deletes a component from the datatype and also from the view
 */
function deleteWidgetFromUserWidgetAndFromView(widgetId) {
    var parent = selectedUserWidget.getInnerWidget(widgetId, true);
    parent.deleteInnerWidget(widgetId);
    removeUserWidgetFromView(widgetId);
    listDisplay.refresh();
}

function unlinkWidgetAndRemoveFromView(widgetId) {
    var widget = selectedUserWidget.getInnerWidget(widgetId);
    var parent = selectedUserWidget.getInnerWidget(widgetId, true);
    parent.deleteInnerWidget(widgetId);
    userApp.addWidget(widget);
    removeUserWidgetFromView(widgetId);
    listDisplay.refresh();
}


//// keyboard shortcuts
//$(document).keydown(function(e){
//    // Save combination
//    if ((event.which == 115 && event.ctrlKey) || (event.which == 19)){
//        alert("Ctrl-S pressed");
//        event.preventDefault();
//    }
//});



/**
 * Update the saved ratios and then use this function
 */
function propagateRatioChangeToAllElts(newRatio, userWidget){
    var workSurfaceRef = workSurface.getWorkSurfaceRef();

    view.displayWidget(false, userWidget, $('#'+workSurfaceRef+'_'+userWidget.meta.id), {}, newRatio);
    miniNav.updateNavInnerWidgetSizes(newRatio);
    grid.setUpGrid();
}

function addDeleteUserWidgetButton(userWidgetId, listElt){
    var buttonDeleteUserWidget = $('<button type="button" class="btn btn-default btn-delete-component">' +
        '<span class="glyphicon glyphicon-trash"></span>' +
        '</button>');
    buttonDeleteUserWidget.attr('id', 'btn-delete-component_'+userWidgetId);

    buttonDeleteUserWidget.on("click", function (e) {
        if (userApp.getNumWidgets() == 1){
            return; //don't delete the last one TODO is the the right way to go?
        }
        if (confirmOnUserWidgetDelete){
            openDeleteUserWidgetConfirmDialogue(userWidgetId);
        } else {
            deleteUserWidget(userWidgetId);
        }
    });

    listElt.find('.delete-button-container').append(buttonDeleteUserWidget);
    listElt.hover(
        function(){
            $(this).find('.component-name-container').css({
                width: '70%'
            });
            $(this).find('.delete-button-container').css({
                display: 'inline-block',
            });
        }, function(){
            $(this).find('.component-name-container').css({
                width: '95%'
            });
            $(this).find('.delete-button-container').css({
                display: 'none',

            });
        }
    );
}

function deleteUserWidget(userWidgetId){
    if (userApp.getNumWidgets() == 1){
        return; //don't delete the last one TODO is the the right way to go?
    }
    userApp.deleteWidget(userWidgetId);
    var workSurfaceRef = workSurface.getWorkSurfaceRef();

    $('#'+workSurfaceRef+'_'+userWidgetId).remove();
    $('#disabled_'+userWidgetId+'_'+workSurfaceRef+'_'+userWidgetId).remove(); // also remove disabled ones

    if (userWidgetId == selectedUserWidget.meta.id){ // strings will also do
        var otherIds = userApp.getAllWidgetIds();
        selectedUserWidget = userApp.getWidget(otherIds[0]);
        workSurface.loadUserWidget(selectedUserWidget, currentZoom);
    }
    if (userWidgetId == userApp.widgets.indexId){
        userApp.widgets.indexId = null;
    }
    listDisplay.refresh();
}

function openDeleteUserWidgetConfirmDialogue(userWidgetId){
    $('#confirm-delete-userComponent').modal('show');
    $('#delete-userComponent-name').text(userApp.getWidget(userWidgetId).meta.name);

    $('#delete-userComponent-btn').unbind();
    $('#delete-userComponent-btn').click(function(){
        deleteUserWidget(userWidgetId);

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




/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/

/**
 * Creates a new User component based on user inputs
 * @param isDefault
 * @constructor
 */
function initUserWidget(isDefault, inMainPage) {
    var name, version, author;
    if (isDefault) {
        name = DEFAULT_WIDGET_NAME;
    } else {
        name = utils.sanitizeStringOfSpecialChars($('#new-component-name').val());
    }

    version = selectedProject.meta.version;
    author = selectedProject.meta.author;

    var id = utils.generateId();

    if (inMainPage){
        return UserWidget({height: selectedScreenSizeHeight, width: selectedScreenSizeWidth}, name, id, version, author);
    }
    return UserWidget({height: 400, width: 600}, name, id, version, author);
}

function initUserApp() {
    var name, version, author;
    name = selectedProject.meta.name;
    version = selectedProject.meta.version;
    author = selectedProject.meta.author;

    var id = utils.generateId();

    var firstPage = initUserWidget(true, true);
    var component = ClicheWithDisplay(name, id, version, author);
    component.addPage(firstPage);
    return component;
}


function duplicateUserWidget(userWidget){
    return UserWidget.fromString(JSON.stringify(userWidget));
}

function clearAll(){
    for (var widgetId in selectedUserWidget.innerWidgets){
        deleteWidgetFromUserWidgetAndFromView(widgetId);
    }
}

