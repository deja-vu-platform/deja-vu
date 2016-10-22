/**
 * Created by Shinjini on 9/26/2016.
 */


/**
 * enables it if its elements have already been created,
 * otherwise loads the elements into the DOM
 * @param component
 * @param zoom
 */
function loadComponent(component){
    var componentId = component.meta.id;
    var workSurface = $('#work-surface'+'_'+componentId);
    if (workSurface.length===0){
        currentZoom = 1;
        loadComponentIntoWorkSurface(component, currentZoom);
    } else {
        disableAllComponentDomElementsExcept(componentId);
        updateZoomFromState(componentId);
    }
}

function createOrResetWorkSurface(component, zoom){
    var componentId = component.meta.id;
    var workSurface = $('#work-surface'+'_'+componentId);
    if (workSurface.length===0){
        workSurface = setUpEmptyWorkSurface(component, zoom);
    } else {
        resetWorkSurface(workSurface);
    }

    return workSurface
}

function resetWorkSurface(workSurface){
    var state = {
        zoom: 1,
    };
    workSurface.data('state', state);
    workSurface.html('');
}

/**
 * creates an empty worksurface and appends it to the outer container
 * @param component
 * @param zoom
 */
function setUpEmptyWorkSurface(component, zoom){
    currentZoom = zoom; // set zoom value 100%
    var componentId = component.meta.id;
    disableAllComponentDomElementsExcept(componentId);
    var workSurface = createWorkSurface(componentId, component.dimensions.height, component.dimensions.width);
    resetWorkSurface(workSurface);

    $('#outer-container').append(workSurface);

    makeWorkSurfaceResizable(workSurface, component); // TODO experimentation
    makeDroppableToComponents(workSurface);
    setComponentOptions(selectedProject.components[componentId]);
    updateZoomFromState(componentId);

    return workSurface
}


/**
 * Loads elements into the DOM. If the elements were already there, gets rid of them
 * and creates them afresh.
 * @param component
 * @param zoom
 */
var loadComponentIntoWorkSurface = function(component, zoom){
    var workSurface = createOrResetWorkSurface(component, zoom);

    component.layout.stackOrder.forEach(function(innerComponentId){
        var innerComponent = component.components[innerComponentId];
        var type = innerComponent.type;
        var componentContainer = createComponentContainer(innerComponent, zoom);
        var widget = $('.draggable[name=' + type + ']').clone();
        widget.addClass('associated').data('componentId', innerComponentId);

        componentContainer.css({
            position: 'absolute',
            left: component.layout[innerComponentId].left,
            top: component.layout[innerComponentId].top,

        });

        setUpContainer(componentContainer, widget, innerComponent, zoom);
        registerDraggable(widget);
        workSurface.append(componentContainer);
        showConfigOptions(type, componentContainer);
        triggerEdit(componentContainer, false);
        registerTooltipBtnHandlers('component-container_'+innerComponentId);
    });
    zoomNavInitialize();
    setUpGrid();

};


var createWorkSurface = function(componentId, height, width){
    var workSurface = $('<div></div>');
    workSurface.addClass('work-surface');
    workSurface.attr('id', 'work-surface_'+componentId);

    workSurface.height(height).width(width);
    return workSurface;
};

function makeWorkSurfaceResizable(workSurface, component){
    var componentId = component.meta.id;

    var dragHandle_se = $('<span></span>');
    dragHandle_se.html('<img src="images/drag_handle_se_icon.png" width="15px" height="15px">');
    dragHandle_se.addClass('ui-resizable-handle ui-resizable-se drag-handle');
    dragHandle_se.attr('id', 'drag-handle-se' + '_' + componentId);

    workSurface.append(dragHandle_se);


    $(workSurface).resizable({
        handles: {
            'se': dragHandle_se,
        },
        minHeight: 0,
        minWidth: 0,
        start: function(){
            var numComponents = selectedUserComponent.layout.stackOrder.length;
            var minWidth = $('#grid-cell_'+(2*numComponents)+'_'+(2*numComponents)).position().left;
            var minHeight = $('#grid-cell_'+(2*numComponents)+'_'+(2*numComponents)).position().top;
            $(this).resizable('option', 'minWidth', minWidth);
            $(this).resizable('option', 'minHeight', minHeight);
        },
        resize: function(e, ui){
            component.dimensions.height = ui.size.height/currentZoom;
            component.dimensions.width = ui.size.width/currentZoom;
        },
        stop: function(e, ui){
            // not super important to update as you resize so just do it at the end
            updateNavComponentSize(currentZoom);
            setUpGrid();

        }
    });

}

function makeContainerResizable(container, component){
    var componentId = component.meta.id;

    var dragHandle_se = $('<span></span>');
    dragHandle_se.html('<img src="images/drag_handle_se_icon.png" width="15px" height="15px">');
    dragHandle_se.addClass('ui-resizable-handle ui-resizable-se drag-handle');
    dragHandle_se.attr('id', 'drag-handle-se' + '_' + componentId);
    
    var dragHandle_sw = $('<span></span>');
    dragHandle_sw.html('<img src="images/drag_handle_sw_icon.png" width="15px" height="15px">');
    dragHandle_sw.addClass('ui-resizable-handle ui-resizable-sw drag-handle');
    dragHandle_sw.attr('id', 'drag-handle-sw' + '_' + componentId);

    var dragHandle_ne = $('<span></span>');
    dragHandle_ne.html('<img src="images/drag_handle_ne_icon.png" width="15px" height="15px">');
    dragHandle_ne.addClass('ui-resizable-handle ui-resizable-ne drag-handle');
    dragHandle_ne.attr('id', 'drag-handle-se' + '_' + componentId);

    var dragHandle_nw = $('<span></span>');
    dragHandle_nw.html('<img src="images/drag_handle_nw_icon.png" width="15px" height="15px">');
    dragHandle_nw.addClass('ui-resizable-handle ui-resizable-nw drag-handle');
    dragHandle_nw.attr('id', 'drag-handle-nw' + '_' + componentId);

    container.append(dragHandle_se);
    container.append(dragHandle_sw);
    container.append(dragHandle_ne);
    container.append(dragHandle_nw);


    $(container).resizable({
        handles: {
            'se': dragHandle_se,
            'sw': dragHandle_sw,
            'ne': dragHandle_ne,
            'nw': dragHandle_nw
        },
        snap: '.grid-cell',
        snapTolerance: 10,
        // helper: function(e, ui){
        //     setUpGrid();
        //     var helper = $(ui).clone();
        //     helper.data('componentId', $(ui).data('componentId'));
        //     helper.attr('id', 'resize-helper')
        //     return $(ui).attr('id');
        // },
        start: function(){
            $('.grid').css({
                visibility: 'visible'
            });
        },
        resize: function(e, ui){
            component.dimensions.height = ui.size.height/currentZoom;
            component.dimensions.width = ui.size.width/currentZoom;
            // TODO woah! It resizes as you go!
            refreshContainerDisplay(container.attr('id'), currentZoom);
            // refreshContainerDisplay('resize-helper', currentZoom);
        },
        stop: function(e, ui){
            // not super important to update as you resize so just do it at the end
            updateNavComponentSize(currentZoom);

            $('.grid').css({
                visibility: 'hidden'
            });
        }
    });
}

function createComponentContainer(component, zoom) {
    var container = $('<div></div>');
    var containerId = 'component-container_'+component.meta.id;
    container.addClass('cell dropped component-container containing-cell').attr('id', containerId);
    container.height(component.dimensions.height * zoom).width(component.dimensions.width * zoom);
    container.data('componentId', component.meta.id);

    makeContainerResizable(container, component);

    var optionsDropdown = $('<div class="dropdown inner-component-options-small">'+
        '<button class="btn btn-default dropdown-toggle btn-xs" type="button" data-toggle="dropdown">'+
        '<span class="glyphicon glyphicon-option-vertical"></span></button>'+
        '<ul class="dropdown-menu">'+
        '</ul>'+
        '</div>');

    var buttonEdit = $('<li>' +
        '<a href="#" class="edit-btn">' +
        '<span class="glyphicon glyphicon-pencil"></span>' +
        '</a>' +
        '</li>');

    buttonEdit.attr('id', 'edit-btn' + '_' + component.meta.id);

    buttonEdit.on("click", function (e) {
        container.find('.tooltip').addClass('open');
    });

    var buttonTrash = $('<li>' +
        '<a href="#" class="inner-component-trash">' +
        '<span class="glyphicon glyphicon-trash"></span>' +
        '</a>' +
        '</li>');

    buttonTrash.attr('id', 'inner-component-trash' + '_' + component.meta.id);

    buttonTrash.click(function(){
        deleteComponentFromUserComponentAndFromView(component.meta.id)
    });

    optionsDropdown.find('.dropdown-menu').append(buttonEdit).append('<li class="divider"></li>').append(buttonTrash);
    container.append(optionsDropdown);



    return container;
}

function setUpContainer(container, widget, component, zoom){
    container.append(widget);
    var type = widget.attr('name');
    if (component){
        var html = getHTML[type](component.components[type]);
    } else {
        var html = getHTML[type]();
    }
    display(container, type, html, zoom);

}

var shiftOrder = function(componentId){
    var stackOrder = selectedUserComponent.layout.stackOrder;

    var index;
    for (var i = 0; i < stackOrder.length; i++){
        var id = stackOrder[i];
        if (componentId == id){
            index = i;
            break
        }
    }
    selectedUserComponent.layout.stackOrder.splice(index, 1);
    selectedUserComponent.layout.stackOrder.push(componentId);
};

var findComponentsToShift = function(movingId, otherId){// TODO better naming?
    var container = $('#component-container_'+otherId);

    var top = container.offset().top;
    var left = container.offset().left;
    var right = left + container.width();
    var bottom = top + container.height();
    var componentsToShift = {};
    [left, right].forEach(function(x) {
        [top, bottom].forEach(function (y) {
            var allElements = allElementsFromPoint(x, y);
            var overlappingComponents = [];
            $(allElements).filter('.component-container').each(function (idx, elt) {
                var containerId = $(elt).attr('id');
                if (containerId != 'dragging-container') {
                    var id = getComponentIdFromContainerId($(elt).attr('id'));
                    if (movingId == otherId){ // if we are looking at the moving container
                        if (!(id == movingId)) {
                            overlappingComponents.push(id); // push in every other overlapping container
                        }
                    } else {
                        if (id == movingId){ // if we overlap with the moving container
                            overlappingComponents.push(otherId); // push it in
                        }
                    }
                }
            });
            overlappingComponents.forEach(function (id) {
                if (!(id in componentsToShift)) {
                    componentsToShift[id] = "";
                }
            })
        });
    });
    return Object.keys(componentsToShift);
};

var changeOrderByOne = function(componentId, isUp){
    var componentsToShift = {};
    for (var id in selectedUserComponent.components){
        var overlappingComponents = findComponentsToShift(componentId, id);
        overlappingComponents.forEach(function(id){
            if (!(id in componentsToShift)){
                componentsToShift[id] = "";
            }
        })
    }

    var stackOrder = selectedUserComponent.layout.stackOrder;
    var idxThisComponent;
    var idxNextComponent;
    if (!isUp){
         stackOrder.reverse();
    }
    for (var i = 0; i<stackOrder.length; i++){
        var id = stackOrder[i];
        if (id == componentId){
            idxThisComponent = i;
        }
        if (typeof idxThisComponent !== 'undefined'){ // 0 is considered false!
            // we have passed this component!
            if (id in componentsToShift){
                idxNextComponent = i;
                break;
            }
        }
    }
    if (typeof idxNextComponent !== 'undefined') { // there is something to move
        var idxToSwap = idxThisComponent;
        // from the component after this to the next
        for (var i = idxThisComponent + 1; i < idxNextComponent + 1; i++) {
            var id = stackOrder[i];
            stackOrder[idxToSwap] = id;
            idxToSwap = i;
        }
        stackOrder[idxNextComponent] = componentId;
    }
    if (!isUp){
        stackOrder.reverse();
    }
    selectedUserComponent.layout.stackOrder = stackOrder;
    console.log(stackOrder);
};


var makeDroppableToComponents = function(workSurface){

    var dropSettings = {
        accept: ".widget",
        hoverClass: "highlight",
        tolerance: "fit",
        drop: function(event, ui) {
            // alert the draggable that drop was successful:
            $(ui.helper).data('dropped', true);
            var top = ui.position.top;
            var left = ui.position.left;


            var widget = $(ui.draggable);
            // on drop, there should always be a dragging component
            var component = draggingComponent;
            var componentId = component.meta.id;
            var componentContainer = createComponentContainer(component, currentZoom);
            setUpContainer(componentContainer, widget, component, currentZoom);
            registerDraggable();
            showConfigOptions(component.type, componentContainer);
            if (!widget.hasClass('associated')){
                $(ui.helper).data('newcomponent', true);
                selectedUserComponent.addComponent(component);
                widget.addClass('associated').data('componentId', componentId);
                triggerEdit(componentContainer, true);
            } else {
                shiftOrder(componentId);
                triggerEdit(componentContainer, false);
            }

            workSurface.append(componentContainer);
            registerTooltipBtnHandlers();


            componentContainer.css({
                position: 'absolute',
                left: left,
                top: top
            });
            selectedUserComponent.layout[componentId] = {top: top/currentZoom, left: left/currentZoom};
            updateNavComponentSize(currentZoom);
            setUpGrid();
        }
    };

    workSurface.droppable(dropSettings);
};