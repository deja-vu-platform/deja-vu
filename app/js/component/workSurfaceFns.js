/**
 * Created by Shinjini on 9/26/2016.
 */

var createWorkSurface = function(componentId, height, width){
    var workSurface = $('<div></div>');
    workSurface.addClass('work-surface');
    workSurface.attr('id', 'work-surface_'+componentId);

    workSurface.height(height).width(width);
    workSurface.css('background', 'blue');

    makeDroppableToComponents(workSurface);
    return workSurface;
};

var makeDroppableToComponents = function(workSurface){

    var dropSettings = {
        accept: ".widget",
        hoverClass: "highlight",
        tolerance: "intersect",
        drop: function(event, ui) {
            // TODO: make the container move with the widget (or destroy and recreate)
            if (true/*detect creation of new component*/){
                var componentContainer = $('<div></div>');
                var widget = $(ui.draggable);
                componentContainer.append(widget);
                var type = widget.attr('name');
                var component = BaseComponent(type, {}, {height: 200, width: 200} /* dimensions, maybe from a table of defaults?*/);
                componentContainer.attr('id', 'componentContainer_'+component.meta.id);
                componentContainer.height(component.dimensions.height).width(component.dimensions.width);
            } else {
                // somehow get the component/componentId to update layout
            }
            workSurface.append(componentContainer);
            componentContainer.css({
                position: 'absolute',
                left: event.clientX - workSurface.offset().left,
                top: event.clientY - workSurface.offset().top
            });

            displayNew(componentContainer[0].id, getHTML[type]);

            $('#basic-components').html(basicComponents);
            registerDraggable();

        }
    };

    workSurface.droppable(dropSettings);

};