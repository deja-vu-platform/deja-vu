/**
 * Created by Shinjini on 9/26/2016.
 */

var loadComponentIntoWorkSurface = function(component){
    var workSurface = createWorkSurface(component.meta.id, component.dimensions.height, component.dimensions.width);
    $('#outer-container').append(workSurface);
    Object.keys(component.components).forEach(function(innerComponentId){
        var innerComponent = component.components[innerComponentId];
        var type = innerComponent.type;
        var componentContainer = createComponentContainer(innerComponent);
        //componentContainer.append(widget);
        workSurface.append(componentContainer);
        displayNew('component-container_'+innerComponentId, type, getHTML[type](innerComponent.components[type]));
        var widget = $('.draggable[name=' + type + ']').clone();
        widget.addClass('associated').data('componentId', innerComponentId);
        componentContainer.append(widget);

        componentContainer.css({
            position: 'absolute',
            left: component.layout[innerComponentId].left,
            top: component.layout[innerComponentId].top
        });
        //$('#basic-components').html(basicComponents);
        triggerEdit('component-container_'+innerComponentId, false);
        registerTooltipBtnHandlers('component-container_'+innerComponentId);
    });
    registerDraggable();
};


var createWorkSurface = function(componentId, height, width){
    var workSurface = $('<div></div>');
    workSurface.addClass('work-surface');
    workSurface.attr('id', 'work-surface_'+componentId);

    workSurface.height(height).width(width);
    workSurface.css('background', 'blue');

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
    dragHandle_se.html('<img src="images/drag_handle_se_icon.png" width="15px" height="15px">');
    dragHandle_se.addClass('ui-resizable-handle ui-resizable-se drag-handle');
    dragHandle_se.attr('id', 'drag-handle-se' + '_' + componentId);

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
            console.log(ui);
            component.dimensions.height = ui.size.height;
            component.dimensions.width = ui.size.width;
            refreshCellDisplay(container.attr('id'), 1); // TODO

        }
    });
}

function createComponentContainer(component) {
    var container = $('<div></div>');
    var containerId = 'component-container_'+component.meta.id;
    container.addClass('cell dropped component-container containing-cell').attr('id', containerId);
    container.height(component.dimensions.height).width(component.dimensions.width);
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


var makeDroppableToComponents = function(workSurface){

    var dropSettings = {
        accept: ".widget",
        hoverClass: "highlight",
        tolerance: "intersect",
        drop: function(event, ui) {
            var widget = $(ui.draggable);
            var type = widget.attr('name');
            var componentContainer;
            var component;
            var componentId;
            if (widget.hasClass('associated')){
                componentId = widget.data('componentId');
                componentContainer = $('#component-container_'+componentId);
                component = selectedUserComponent.components[componentId];
            } else {
                component = BaseComponent(type, {}, {height: 200, width: 200} /* dimensions, maybe from a table of defaults?*/);
                componentId = component.meta.id;
                widget.addClass('associated').data('componentId', componentId);
                selectedUserComponent.components[componentId] = component;
                componentContainer = createComponentContainer(component);
                componentContainer.append(widget);
                workSurface.append(componentContainer);
                displayNew(componentContainer[0].id, type, getHTML[type]());

                $('#basic-components').html(basicComponents);
                registerDraggable();
                triggerEdit('component-container_'+component.meta.id, true);
            }

            var top = event.clientY - workSurface.offset().top - component.dimensions.height; // TODO
            var left = event.clientX - workSurface.offset().left; // TODO
            componentContainer.css({
                position: 'absolute',
                left: left,
                top: top
            });
            selectedUserComponent.layout[componentId] = {top: top, left: left};

        }
    };

    workSurface.droppable(dropSettings);

};