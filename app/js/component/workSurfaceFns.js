/**
 * Created by Shinjini on 9/26/2016.
 */

var loadComponentIntoWorkSurface = function(component){
    var workSurface = createWorkSurface(component.meta.id, component.dimensions.height, component.dimensions.width);
    $('#outer-container').append(workSurface);
    Object.keys(component.components).forEach(function(innerComponentId){
        var innerComponent = component.components[innerComponentId];
        var type = innerComponent.type;
        var innerComponentId = innerComponent.meta.id;
        var componentContainer = createComponentContainer(innerComponent);
        //componentContainer.append(widget);
        workSurface.append(componentContainer);
        displayNew('component-container_'+innerComponentId, getHTML[type](innerComponent.components[type]));
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


function createComponentContainer(component) {
    var container = $('<div></div>');
    container.addClass('cell dropped component-container containing-cell').attr('id', 'component-container_'+component.meta.id);
    container.height(component.dimensions.height).width(component.dimensions.width);
    container.data('componentId', component.meta.id);

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
        $('#component-container' + '_' + component.meta.id).find('.tooltip').addClass('open');
    });

    var buttonTrash = $('<li>' +
        '<a href="#" class="inner-component-trash">' +
        '<span class="glyphicon glyphicon-trash"></span>' +
        '</a>' +
        '</li>');

    buttonTrash.attr('id', 'inner-component-trash' + '_' + component.meta.id);

    buttonTrash.click(function(){

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
            if (widget.hasClass('associated')){
                var componentId = widget.data('componentId');
                componentContainer = $('#component-container_'+componentId);
            } else {
                var component = BaseComponent(type, {}, {height: 200, width: 200} /* dimensions, maybe from a table of defaults?*/);
                var componentId = component.meta.id;
                widget.addClass('associated').data('componentId', componentId);
                selectedUserComponent.components[componentId] = component;
                componentContainer = createComponentContainer(component);
                componentContainer.append(widget);
                workSurface.append(componentContainer);
                displayNew(componentContainer[0].id, getHTML[type]());

                $('#basic-components').html(basicComponents);
                registerDraggable();
                triggerEdit('component-container_'+component.meta.id, true);
            }

            var top = event.clientY - workSurface.offset().top;
            var left = event.clientX - workSurface.offset().left;
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