/**
 * Created by Shinjini on 1/7/2017.
 */

var DataDragAndDropController = function () {
    var that = Object.create(DataDragAndDropController.prototype);

    var draggingDatatype = null;

    that.getDraggingWidget = function () {
        return draggingDatatype;
    };

    var containerRef = dataContainerMaker.getContainerRef();
    var workSurfaceRef = dataWorkSurface.getWorkSurfaceRef();


    that.dataToWorkSurfaceDropSettings = function (component, dropFinished) {
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
                var datatype = draggingDatatype;
                var datatypeId = datatype.meta.id;
                dragHandle.removeClass('dragging-component');


                var widgetIsAssociated = dragHandle.hasClass('associated');
                dragHandle.associated = widgetIsAssociated;

                var difference = {top: 0, left: 0};

                if (!widgetIsAssociated) {
                    $(ui.helper).data('newcomponent', true);
                    dragHandle.newWidget = true;
                    component.addInnerWidget(datatype);
                    dragHandle.addClass('associated').data('componentid', datatypeId);
                    dataZoomElement.registerZoom(component);
                } else {
                    var parent = dataEditsManager.getInnerWidget(selectedUserWidget, datatypeId, true);
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
                newLayout[datatypeId] = newPosition;
                // after it has been added
                dataEditsManager.updateCustomProperties(selectedUserWidget, datatypeId, 'layout', newLayout, true);
                // outerWidget.properties.layout[widgetId] = newLayout;

                dataMiniNav.updateMiniNavInnerWidgetSizes(component, currentZoom);

                dropFinished(dragHandle, datatype);
            }
        }
    };

    that.datatypeDragSettings = function () {
        return {
            opacity: 1,
            revert: "invalid",
            cursorAt: {top: 0, left: 0},
            helper: function (e, ui) {
                var dragHandle = $(this);
                var type = dragHandle.data('type');
                if (type == 'user') {
                    if (!dragHandle.hasClass('associated')) {
                        dragHandle = $('#basic-cliches .draggable[data-type=' + type + ']').clone();
                        dragHandle.data('componentid', $(this).data('componentid'));
                        dragHandle.data('type', type);
                        that.registerDataDragHandleDraggable(dragHandle);
                    }
                }
                dragHandle.addClass('dragging-component');
                var offsetFromMouse = {top: 0, left: 0};
                var datatypeContainer;
                if (dragHandle.hasClass('associated')) {
                    var datatypeId = dragHandle.data('componentid');
                    draggingDatatype = userApp.datatypes.used[datatypeId];
                    //draggingWidget = selectedUserWidget.innerWidgets[widgetId];
                    // keep the old one for now, for guidance and all
                    var oldContainerId = containerRef+'_' + datatypeId;
                    var widgetContainerOld = $('#' + oldContainerId);
                    widgetContainerOld.css({
                        opacity: .3,
                    });
                    datatypeContainer = widgetContainerOld.clone();
                    widgetContainerOld.attr('id', oldContainerId + '_old');
                    offsetFromMouse = {
                        top: e.pageY - widgetContainerOld.offset().top,
                        left: e.pageX - widgetContainerOld.offset().left
                    };
                } else {
                    var datatype;
                    var id = dragHandle.data('componentid');
                    datatype = UserDatatype.fromString(JSON.stringify(userApp.datatypes.used[id]));
                    datatype.meta.templateId = datatype.meta.id;
                    datatype = createDatatypeCopy(datatype);
                    dragHandle.data('componentid', datatype.meta.id);
                    dragHandle.text(datatype.meta.name);
                    dragHandle.css('display', 'block');
                    draggingDatatype = datatype;
                    var displayPropObj = userApp.datatypeDisplays[id];
                    datatypeContainer = dataWorkSurface.makeDatatypeContainers(datatype, displayPropObj, dragHandle, zoom);

                    $('#basic-cliches').html(basicWidgets);
                    that.registerWidgetDragHandleDraggable();
                }

                $('#outer-container').append(datatypeContainer);
                dragHandle.draggable("option", "cursorAt", offsetFromMouse);

                //Hack to append the widget to the html (visible above others divs), but still belonging to the scrollable container
                // componentContainer.hide();
                // setTimeout(function(){
                //     componentContainer.appendTo('html');
                //     componentContainer.show();
                // },1);
                datatypeContainer.attr('id', 'dragging-container');
                datatypeContainer.css('position', 'absolute');

                return datatypeContainer;

            },
            appendTo: 'html',
            cursor: '-webkit-grabbing',
            scroll: true,
            snapTolerance: 10,
            start: function () {

            },
            drag: function (event, ui) {

            },
            stop: function (event, ui) {

                var widgetId = draggingDatatype.meta.id;
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



    that.registerDataDragHandleDraggable = function(dragHandleToRegister) {
        if (dragHandleToRegister){
            if (!dragHandleToRegister.notDraggable){
                dragHandleToRegister.draggable(that.datatypeDragSettings());
            }
        } else {
            $('.widget').not('.not-draggable').each(function() {
                $(this).draggable(that.datatypeDragSettings());
            });
        }

    };



    Object.freeze(that);
    return that
};

