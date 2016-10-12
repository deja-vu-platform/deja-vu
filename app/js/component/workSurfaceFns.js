/**
 * Created by Shinjini on 9/26/2016.
 */


/**
 * enables it if its elements have already been created,
 * otherwise loads the elements into the DOM
 * @param component
 * @param zoom
 */
function loadComponent(component, zoom){
    var componentId = component.meta.id;
    var workSurface = $('#work-surface'+'_'+componentId);
    if (workSurface.length===0){
        loadComponentIntoWorkSurface(component, zoom);
    } else {
        disableAllComponentDomElementsExcept(componentId);
    }
}

function createOrResetWorkSurface(component, zoom){
    var componentId = component.meta.id;
    var workSurface = $('#work-surface'+'_'+componentId);
    if (workSurface.length===0){
        workSurface = createEmptyWorkSurface(component, zoom);
    } else {
        workSurface.html('');
    }
    return workSurface
}

function createEmptyWorkSurface(component, zoom){
    currentZoom = zoom; // set zoom value 100%
    var componentId = component.meta.id;
    disableAllComponentDomElementsExcept(componentId);
    var workSurface = createWorkSurface(componentId, component.dimensions.height, component.dimensions.width);
    $('#outer-container').append(workSurface);

    setComponentOptions(selectedProject.components[componentId]);
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

    Object.keys(component.components).forEach(function(innerComponentId){
        var innerComponent = component.components[innerComponentId];
        var type = innerComponent.type;
        var componentContainer = createComponentContainer(innerComponent, zoom);
        var widget = $('.draggable[name=' + type + ']').clone();
        widget.addClass('associated').data('componentId', innerComponentId);

        componentContainer.css({
            position: 'absolute',
            left: component.layout[innerComponentId].left,
            top: component.layout[innerComponentId].top
        });

        setUpContainer(componentContainer, widget, innerComponent, zoom);
        registerDraggable(widget);
        workSurface.append(componentContainer);

        triggerEdit(componentContainer, false);
        registerTooltipBtnHandlers('component-container_'+innerComponentId);
    });
};


var createWorkSurface = function(componentId, height, width){
    var workSurface = $('<div></div>');
    workSurface.addClass('work-surface');
    workSurface.attr('id', 'work-surface_'+componentId);

    workSurface.height(height).width(width);
    workSurface.css('background', 'lightblue');

    makeDroppableToComponents(workSurface);
    return workSurface;
};

function createResizeHandle(container, component){
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
        resize: function(e, ui){
            component.dimensions.height = ui.size.height/currentZoom;
            component.dimensions.width = ui.size.width/currentZoom;
            // TODO woah! It resizes as you go!
            refreshContainerDisplay(container.attr('id'), currentZoom); // TODO

        }
    });
}

function createComponentContainer(component, zoom) {
    var container = $('<div></div>');
    var containerId = 'component-container_'+component.meta.id;
    container.addClass('cell dropped component-container containing-cell').attr('id', containerId);
    container.height(component.dimensions.height * zoom).width(component.dimensions.width * zoom);
    container.data('componentId', component.meta.id);

    createResizeHandle(container, component);

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
        deleteComponentFromView(containerId);
        container.remove();
        delete selectedUserComponent.components[component.meta.id]; // TODO
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
    displayNew(container, type, html, zoom);

}

var makeDroppableToComponents = function(workSurface){

    var dropSettings = {
        accept: ".widget",
        hoverClass: "highlight",
        tolerance: "intersect",
        drop: function(event, ui) {
            var widget = $(ui.draggable);
            // on drop, there should always be a dragging component
            var component = draggingComponent;
            var componentId = component.meta.id;
            var componentContainer = createComponentContainer(component, currentZoom);
            setUpContainer(componentContainer, widget, component, currentZoom);
            registerDraggable();

            if (!widget.hasClass('associated')){
                selectedUserComponent.components[componentId] = component;
                widget.addClass('associated').data('componentId', componentId);
                triggerEdit(componentContainer, true);
            } else {
                triggerEdit(componentContainer, false);
            }

            workSurface.append(componentContainer);
            registerTooltipBtnHandlers();

            var top = ui.position.top - workSurface.offset().top;
            var left = ui.position.left - workSurface.offset().left;

            componentContainer.css({
                position: 'absolute',
                left: left,
                top: top
            });
            selectedUserComponent.layout[componentId] = {top: top/currentZoom, left: left/currentZoom};

        }
    };

    workSurface.droppable(dropSettings);

};