/**
 * Created by Shinjini on 1/7/2017.
 */

var DataDragAndDropController = function () {
    var that = Object.create(DataDragAndDropController.prototype);

    var draggingObject = null;
    var displayPropObj = null;

    that.getDraggingWidget = function () {
        return draggingObject;
    };

    var containerRef = dataContainerMaker.getContainerRef();
    var workSurfaceRef = dataWorkSurface.getWorkSurfaceRef();


    that.dataToWorkSurfaceDropSettings = function (cliche, dropFinished) {
        var isOverall = cliche? false: true;

        return {
            accept: ".datatype",
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
                        dragHandle.data('clicheid', $(ui.draggable).data('clicheid'));
                        dragHandle.data('type', type);
                        that.registerDataDragHandleDraggable(dragHandle);
                    }
                }

                // on drop, there should always be a dragging widget
                var object = draggingObject;
                var objectId = object.meta.id;
                var originClicheId =  $(ui.draggable).data('clicheid');
                var originCliche = selectedProject.cliches[originClicheId];
                dragHandle.removeClass('dragging-component');


                var dataIsAssociated = dragHandle.hasClass('associated');
                dragHandle.associated = dataIsAssociated;

                var top = ui.position.top;
                var left = ui.position.left;

                var newPosition = {top: top/currentZoom, left: left/currentZoom};
                displayPropObj.displayProperties.position = newPosition;

                if (!dataIsAssociated) { // it's a new datatype thing
                    $(ui.helper).data('newcomponent', true);
                    dragHandle.newDatatype = true;
                    dragHandle.addClass('associated').data('componentid', objectId);
                    // dataZoomElement.registerZoom(component);
                }
                console.log(isOverall);
                if (isOverall){
                    selectedProject.bondDisplays[originClicheId].dataBondDisplays[objectId].displayProperties.position = newPosition;
                } else {
                    cliche.dataBondDisplays[objectId].displayProperties.position = newPosition;
                }

                // after it has been added


                // dataMiniNav.updateMiniNavInnerWidgetSizes(userApp, currentZoom);

                dropFinished(dragHandle, originCliche, object);
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
                var clicheId = dragHandle.data('clicheid');
                var datatypeId = dragHandle.data('componentid');



                if (type == 'user') {
                    if (!dragHandle.hasClass('associated')) {
                        dragHandle = $('#basic-components .draggable[data-type=' + type + ']').clone();
                        dragHandle.data('componentid', datatypeId);
                        dragHandle.data('clicheid', clicheId);
                        dragHandle.data('type', type);
                        that.registerDataDragHandleDraggable(dragHandle);
                    }
                }
                dragHandle.addClass('dragging-component');
                var offsetFromMouse = {top: 0, left: 0};
                var datatypeContainer;
                if (!selectedCliche){
                    displayPropObj = selectedProject.bondDisplays[clicheId].dataBondDisplays[datatypeId]; // might not exists
                } else {
                    displayPropObj = selectedProject.cliches[clicheId].dataBondDisplays[datatypeId]; // might not exists
                }

                if (dragHandle.hasClass('associated')) {
                    if (datatypeId in selectedProject.cliches){ // if it is a cliche
                        draggingObject = selectedProject.cliches[clicheId];
                    } else {
                        draggingObject = userApp.datatypes[datatypeId];
                    }
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
                    if (datatypeId in selectedProject.cliches){ // if it is a cliche
                        datatype = selectedProject.cliches[clicheId];
                    } else {
                        datatype = userApp.datatypes[datatypeId];
                    }

                    dragHandle.data('componentid', datatype.meta.id);
                    dragHandle.text(datatype.meta.name);
                    dragHandle.css('display', 'block');
                    draggingObject = datatype;
                    datatypeContainer = dataWorkSurface.makeContainer(clicheId, datatype.meta.id, displayPropObj, dragHandle, currentZoom, isOverall);

                    $('#basic-components').html(basicWidgets);
                    that.registerDataDragHandleDraggable();
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

                var widgetId = draggingObject.meta.id;
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
        }
        // else {
        //     $('.widget').not('.not-draggable').each(function() {
        //         $(this).draggable(that.datatypeDragSettings());
        //     });
        // }

    };



    Object.freeze(that);
    return that
};

