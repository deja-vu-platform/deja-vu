/**
 * Created by Shinjini on 1/7/2017.
 */

var WidgetDragAndDropController = function () {
    var that = Object.create(WidgetDragAndDropController.prototype);

    var draggingWidget = null;

    var containerRef = widgetContainerMaker.getContainerRef();
    var workSurfaceRef = workSurface.getWorkSurfaceRef();


    that.getDraggingWidget = function () {
        return draggingWidget;
    };

    that.widgetToWorkSurfaceDropSettings = function (outerWidget, dropFinished) {
        return {
            accept: ".widget",
            hoverClass: "highlight",
            tolerance: "fit",
            drop: function (event, ui) {
                // alert the draggable that drop was successful:
                $(ui.helper).data('dropped', true);

                var dragHandle = $(ui.draggable);
                var type = $(ui.draggable).data('type');
                if (type == 'user') {
                    if (!dragHandle.hasClass('associated')) {
                        dragHandle = $(ui.draggable).clone();
                        dragHandle.data('componentid', $(ui.draggable).data('componentid'));
                        dragHandle.data('type', type);
                        that.registerWidgetDragHandleDraggable(dragHandle);
                    }
                }

                // on drop, there should always be a dragging widget
                var widget = draggingWidget;
                var widgetId = widget.meta.id;
                dragHandle.removeClass('dragging-component');


                var widgetIsAssociated = dragHandle.hasClass('associated');
                dragHandle.associated = widgetIsAssociated;

                var difference = {top: 0, left: 0};

                if (!widgetIsAssociated) {
                    $(ui.helper).data('newcomponent', true);
                    dragHandle.newWidget = true;
                    outerWidget.addComponent(widget);
                    dragHandle.addClass('associated').data('componentid', widgetId);
                    zoomElement.registerZoom(outerWidget);
                } else {
                    var parent = widgetEditsManager.getInnerWidget(selectedUserWidget, widgetId, true);
                    var parentId = parent.meta.id;
                    if (parentId != selectedUserWidget.meta.id){ // it is not the outermost widget
                        var workSurfaceOffset = $('#'+workSurfaceRef+'_'+selectedUserWidget.meta.id).offset();
                        var widgetOffset = $('#'+containerRef+'_'+parentId).offset();
                        difference.top = widgetOffset.top - workSurfaceOffset.top;
                        difference.left = widgetOffset.left - workSurfaceOffset.left;
                    }
                }

                var top = ui.position.top - difference.top;
                var left = ui.position.left - difference.left;

                var newPosition = {top: top/currentZoom, left: left/currentZoom};
                var newLayout = {};
                newLayout[widgetId] = newPosition;
                // after it has been added
                widgetEditsManager.updateCustomProperties(selectedUserWidget, widgetId, 'layout', newLayout, true);
                // outerWidget.properties.layout[widgetId] = newLayout;

                miniNav.updateMiniNavInnerWidgetSizes(outerWidget, currentZoom);

                dropFinished(dragHandle, widget);
            }
        }
    };

    that.widgetDragSettings = function () {
        return {
            opacity: 1,
            revert: "invalid",
            cursorAt: {top: 0, left: 0},
            helper: function (e, ui) {
                var dragHandle = $(this);
                var type = dragHandle.data('type');
                if (type == 'user') {
                    if (!dragHandle.hasClass('associated')) {
                        dragHandle = $('#basic-components .draggable[data-type=' + type + ']').clone();
                        dragHandle.data('componentid', $(this).data('componentid'));
                        dragHandle.data('type', type);
                        that.registerWidgetDragHandleDraggable(dragHandle);
                    }
                }
                dragHandle.addClass('dragging-component');
                var offsetFromMouse = {top: 0, left: 0};
                var widgetContainer;
                if (dragHandle.hasClass('associated')) {
                    var widgetId = dragHandle.data('componentid');
                    draggingWidget = widgetEditsManager.getInnerWidget(selectedUserWidget, widgetId)
                    //draggingWidget = selectedUserWidget.innerWidgets[widgetId];
                    // keep the old one for now, for guidance and all
                    var oldContainerId = containerRef+'_' + widgetId;
                    var widgetContainerOld = $('#' + oldContainerId);
                    widgetContainerOld.css({
                        opacity: .3,
                    });
                    widgetContainer = widgetContainerOld.clone();
                    widgetContainerOld.attr('id', oldContainerId + '_old');
                    offsetFromMouse = {
                        top: e.pageY - widgetContainerOld.offset().top,
                        left: e.pageX - widgetContainerOld.offset().left
                    };
                } else {
                    var widget;
                    if (type == 'user') {
                        var id = dragHandle.data('componentid');
                        widget = UserWidget.fromString(JSON.stringify(selectedComponent.widgets[id]));
                        widget.meta.templateId = widget.meta.id;
                        widget = createUserWidgetCopy(widget);
                        dragHandle.data('componentid', widget.meta.id);
                        dragHandle.text(widget.meta.name);
                        dragHandle.css('display', 'block');
                    } else {
                        widget = BaseWidget(type, {}, view.getDimensions(type));
                    }
                    draggingWidget = widget;
                    widgetContainer = workSurface.makeRecursiveWidgetContainersAndDisplay(widget, selectedUserWidget, false,
                        dragHandle, null, selectedUserWidget.properties.styles.custom, currentZoom, false);

                    $('#basic-components').html(basicWidgets);
                    that.registerWidgetDragHandleDraggable();
                }

                $('#outer-container').append(widgetContainer);
                dragHandle.draggable("option", "cursorAt", offsetFromMouse);

                //Hack to append the widget to the html (visible above others divs), but still belonging to the scrollable container
                // componentContainer.hide();
                // setTimeout(function(){
                //     componentContainer.appendTo('html');
                //     componentContainer.show();
                // },1);
                widgetContainer.attr('id', 'dragging-container');
                widgetContainer.css('position', 'absolute');

                return widgetContainer;

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
                $('.grid-line').css({
                    visibility: 'hidden'
                });

            },
            drag: function (event, ui) {
                grid.detectGridLines(ui.helper);

            },
            stop: function (event, ui) {
                $('.grid').css({
                    visibility: 'hidden'
                });
                $('.grid-line').css({
                    visibility: 'hidden'
                });

                var widgetId = draggingWidget.meta.id;
                var isNewWidget = $(ui.helper).data('newcomponent');
                if (!isNewWidget) {
                    var widgetContainerOld = $('#'+containerRef+'_' + widgetId + '_old');
                    if (!$(ui.helper).data('dropped')) {// not properly dropped!
                        widgetContainerOld.attr('id', containerRef+'_' + widgetId);
                        widgetContainerOld.css({
                            opacity: 1,
                        });
                    } else { // properly dropped
                        widgetContainerOld.remove();
                    }
                }

            }
        };
    };



    that.registerWidgetDragHandleDraggable = function(dragHandleToRegister) {
        if (dragHandleToRegister){
            if (!dragHandleToRegister.notDraggable){
                dragHandleToRegister.draggable(that.widgetDragSettings());
            }
        } else {
            $('.widget').not('.not-draggable').each(function() {
                $(this).draggable(that.widgetDragSettings());
            });
        }

    };



    Object.freeze(that);
    return that
};

