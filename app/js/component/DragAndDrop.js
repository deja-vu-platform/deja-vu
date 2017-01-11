/**
 * Created by Shinjini on 1/7/2017.
 */

var DragAndDropController = function () {
    var that = Object.create(DragAndDropController);

    var draggingComponent = null;

    that.getDraggingComponent = function () {
        return draggingComponent;
    };

    that.widgetToWorksurfaceDropSettings = function (outerComponent, dropFinished) {
        return {
            accept: ".widget",
            hoverClass: "highlight",
            tolerance: "fit",
            drop: function (event, ui) {
                // alert the draggable that drop was successful:
                $(ui.helper).data('dropped', true);
                var top = ui.position.top;
                var left = ui.position.left;


                var widget = $(ui.draggable);
                var type = $(ui.draggable).data('type');
                if (type == 'user') {
                    if (!widget.hasClass('associated')) {
                        widget = $(ui.draggable).clone();
                        widget.data('componentid', $(ui.draggable).data('componentid'));
                        widget.data('type', type);
                        registerDraggable(widget);
                    }
                }

                // on drop, there should always be a dragging component
                var component = draggingComponent;
                var componentId = component.meta.id;
                widget.removeClass('dragging-component');
                outerComponent.layout[componentId] = {top: top/currentZoom, left: left/currentZoom};

                var widgetIsAssociated = widget.hasClass('associated');
                widget.associated = widgetIsAssociated;
                if (!widgetIsAssociated) {
                    $(ui.helper).data('newcomponent', true);
                    outerComponent.addComponent(component);
                    widget.addClass('associated').data('componentid', componentId);
                }

                dropFinished(widget, component);
            }
        }
    };

    that.widgetDragSettings = function () {
        return {
            opacity: 1,
            revert: "invalid",
            cursorAt: {top: 0, left: 0},
            helper: function (e, ui) {
                var widget = $(this);
                var type = widget.data('type');
                if (type == 'user') {
                    if (!widget.hasClass('associated')) {
                        widget = $('#basic-components .draggable[data-type=' + type + ']').clone();
                        // widget = $(this).clone();
                        widget.data('componentid', $(this).data('componentid'));
                        widget.data('type', type);
                        registerDraggable(widget);
                    }
                }
                widget.addClass('dragging-component');
                var offsetFromMouse = {top: 0, left: 0};
                var componentContainer;
                if (widget.hasClass('associated')) {
                    var componentId = widget.data('componentid');
                    draggingComponent = selectedUserComponent.components[componentId];
                    // keep the old one for now, for guidance and all
                    var oldContainerId = 'component-container_' + componentId;
                    var componentContainerOld = $('#' + oldContainerId);
                    componentContainerOld.css({
                        opacity: .3,
                    });
                    componentContainer = componentContainerOld.clone();
                    componentContainerOld.attr('id', oldContainerId + '_old');
                    offsetFromMouse = {
                        top: e.pageY - componentContainerOld.offset().top,
                        left: e.pageX - componentContainerOld.offset().left
                    };
                } else {
                    var component;
                    if (type == 'user') {
                        var id = widget.data('componentid');
                        // TODO
                        // FIXME
                        // How to have two copies of the same widget in the same place?
                        component = UserComponent.fromString(JSON.stringify(selectedProject.components[id]));

                        // component.meta.id = (new Date()).getTime();

                        component.meta.parentId = component.meta.id;
                        component = createUserComponentCopy(component);

                        widget.data('componentid', component.meta.id);
                        widget.text(component.meta.name);
                        widget.css('display', 'block');
                    } else {
                        component = BaseComponent(type, {}, view.getDimensions(type));
                    }
                    draggingComponent = component;
                    componentContainer = workSurface.makeRecursiveComponentContainersAndDisplay(component, selectedUserComponent, true, widget, $('#work-surface_' + selectedUserComponent.meta.id), currentZoom, selectedUserComponent.properties.custom);

                    $('#basic-components').html(basicComponents);
                    registerDraggable();
                }

                $('#outer-container').append(componentContainer);
                widget.draggable("option", "cursorAt", offsetFromMouse);

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
            snap: '.grid-cell, .grid-x, .grid-y',
            snapTolerance: 10,
            start: function () {
                $('.grid').css({
                    visibility: 'visible'
                });
            },
            drag: function (event, ui) {
                grid.detectGridLines(ui.helper);

            },
            stop: function (event, ui) {
                $('.grid').css({
                    visibility: 'hidden'
                });

                var componentId = draggingComponent.meta.id;
                var isNewComponent = $(ui.helper).data('newcomponent');
                if (!isNewComponent) {
                    var componentContainerOld = $('#component-container_' + componentId + '_old');
                    if (!$(ui.helper).data('dropped')) {// not properly dropped!
                        componentContainerOld.attr('id', 'component-container_' + componentId);
                        componentContainerOld.css({
                            opacity: 1,
                        });
                    } else { // properly dropped
                        componentContainerOld.remove();
                    }
                }

            }
        };
    };



    Object.freeze(that);
    return that
};

