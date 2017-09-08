/**
 * Created by Shinjini on 9/26/2016.
 */

var widgetContainerMaker = WidgetContainer();

var WidgetWorkSurface = function(){
    var that = Object.create(WidgetWorkSurface.prototype);

    var WIDGET_WS_REF = 'widget-work-surface';

    var containerRef = widgetContainerMaker.getContainerRef();

    // make it such that it takes in a component and a widget Id instead of the widget straight

    that.getWorkSurfaceRef = function(){
        return WIDGET_WS_REF;
    };


    var createWorkSurface = function(outerWidgetId, height, width){
        var workSurface = $('<div></div>');
        workSurface.addClass(WIDGET_WS_REF).addClass('work-surface');
        workSurface.attr('id', WIDGET_WS_REF+'_'+outerWidgetId);

        workSurface.height(height).width(width);
        return workSurface;
    };

    var createOrResetWorkSurface = function(outerWidget, zoom, editable){
        var widgetId = outerWidget.meta.id;
        var workSurface = $('#'+WIDGET_WS_REF+'_'+widgetId);
        if (workSurface.length===0){
            workSurface = setUpEmptyWorkSurface(outerWidget, zoom, editable);
        } else {
            resetWorkSurface(workSurface);
        }

        return workSurface
    };

    var resetWorkSurface = function(workSurface){
        var state = {
            zoom: 1,
        };
        workSurface.data('state', state);
        workSurface.find('.'+containerRef).remove();
    };

    that.makeRecursiveWidgetContainersAndDisplay = function(innerWidget, outerWidget, isThisEditable, isThisDraggable, dragHandle,
                                                            outerWidgetContainer, overallStyles, zoom, associated,
                                                            hackityHack){
        var container = makeRecursiveWidgetContainers(
            innerWidget, outerWidget, isThisEditable, isThisDraggable, dragHandle,
            zoom, associated, outerWidget, hackityHack);
        if (outerWidgetContainer){
            outerWidgetContainer.append(container);
        }
        view.displayWidget(true, innerWidget, container, overallStyles, zoom);
        if (outerWidgetContainer){ // because order matters :(
            registerTooltipBtnHandlers();
        }
        return container;
    };

    // isEditable == component is the selected user component and all its contents are editable
    var makeRecursiveWidgetContainers = function(innerWidget, outerWidget, isThisEditable, isThisDraggable, dragHandle, zoom, associated, outermostWidget, hackityHack){ //FIXME!
        var type = innerWidget.type;
        var widgetId = innerWidget.meta.id;
        var editable = isThisEditable && !innerWidget.meta.templateCorrespondingId;

        // first create a container for this component
        var widgetContainer;
        if (!hackityHack){
            if (!dragHandle) {
                dragHandle = $('#basic-components .draggable[data-type=' + type + ']').clone();
                if (type == 'user') {
                    dragHandle.text(innerWidget.meta.name);
                    dragHandle.css('display', 'block');
                }
                dragHandle.addClass('associated').data('componentid', widgetId).data('clicheid', userApp.meta.id); // TODO is this always userApp?
            }

            if (editable){
                widgetContainer = widgetContainerMaker.createEditableWidgetContainer(innerWidget, outerWidget, zoom, outermostWidget);
                dragAndDrop.registerWidgetDragHandleDraggable(dragHandle);
            } else {
                widgetContainer = widgetContainerMaker.createMinimallyEditableWidgetContainer(innerWidget, outerWidget, zoom, outermostWidget, !isThisDraggable);
                if (isThisDraggable){
                    dragAndDrop.registerWidgetDragHandleDraggable(dragHandle);
                } else {
                    dragHandle.addClass('not-draggable');
                    dragHandle.notDraggable = true;
                }
            }

            widgetContainerMaker.setUpContainer(widgetContainer, dragHandle, innerWidget, associated, outermostWidget);

            var editPopup = false;
            if (dragHandle){
                if (dragHandle.newWidget){
                    if (!dragHandle.hasClass('dragging-component')){
                        editPopup = true;
                    }
                }
            }
            triggerEdit(widgetContainer, editPopup);


        } else {
            widgetContainer = widgetContainerMaker.createBasicWidgetContainer(innerWidget, zoom);
        }

        if (outerWidget.properties.layout[widgetId]){ // means it's not not added yet
            widgetContainer.css({
                position: 'absolute',
                left: outerWidget.properties.layout[widgetId].left*zoom,
                top: outerWidget.properties.layout[widgetId].top*zoom,

            });
        }

        if (type === 'user'){ // do the recursion
            innerWidget.properties.layout.stackOrder.forEach(function(innerInnerWidgetId){
                var innerInnerWidget = innerWidget.innerWidgets[innerInnerWidgetId];
                var childEditable = editable && !innerInnerWidget.meta.templateCorrespondingId;
                var childDraggable = editable;
                var innerInnerWidgetContainer = makeRecursiveWidgetContainers(
                    innerInnerWidget, innerWidget, childEditable, childDraggable, null, zoom,
                    associated, outermostWidget, hackityHack);
                widgetContainer.append(innerInnerWidgetContainer);
            });
        }
        return widgetContainer;
    };

    /**
     * Loads elements into the DOM. If the elements were already there, gets rid of them
     * and creates them afresh.
     * @param userWidget
     * @param zoom
     */
    var loadUserWidgetIntoWorkSurface = function(userWidget, zoom){
        var overallEditable = userWidget.meta.templateCorrespondingId? false: true;
        var workSurface = createOrResetWorkSurface(userWidget, zoom, overallEditable);

        widgetEditsManager.refreshPropertyValues(userWidget);
        userWidget.properties.styles = widgetEditsManager.getMostRelevantOverallCustomChanges(userWidget, userWidget);

        userWidget.properties.layout.stackOrder.forEach(function(innerWidgetId){
            var innerWidget = userWidget.innerWidgets[innerWidgetId];
            var isEditable = overallEditable && innerWidget.meta.templateCorrespondingId? false: true;
            var isDraggable = overallEditable && true;
            var overallStyles = widgetEditsManager.getMostRelevantOverallCustomChanges(userWidget, innerWidgetId);
            that.makeRecursiveWidgetContainersAndDisplay(innerWidget, userWidget, isEditable, isDraggable, null, workSurface, overallStyles, zoom, true);
        });
        miniNav.setUpMiniNavElementAndInnerWidgetSizes(userWidget);

    };

    var makeWorkSurfaceResizable = function(workSurface, userWidget){
        var widgetId = userWidget.meta.id;

        var dragHandle_se = $('<span></span>');
        dragHandle_se.html('<img src="images/drag_handle_se_icon.png" width="15px" height="15px">');
        dragHandle_se.addClass('ui-resizable-handle ui-resizable-se drag-handle');
        dragHandle_se.attr('id', 'drag-handle-se' + '_' + widgetId);

        workSurface.append(dragHandle_se);


        $(workSurface).resizable({
            handles: {
                'se': dragHandle_se,
            },
            minHeight: 0,
            minWidth: 0,
            start: function(){
                // keeping this just as reference to how to do this
                // var minWidth = $('.grid-cell:last').position().left;
                // var minHeight = $('.grid-cell:last').position().top;

                //var minWidth = grid.getRightMostGridPosition();
                //var minHeight = grid.getBottomMostGridPosition();
                //
                //
                //$(this).resizable('option', 'minWidth', minWidth);
                //$(this).resizable('option', 'minHeight', minHeight);
            },
            resize: function(e, ui){
                // TODO need to DRY this up and/or combine with the widget container methods
                var newDimensions = {height: ui.size.height/currentZoom, width: ui.size.width/currentZoom};
                widgetEditsManager.updateCustomProperties(userWidget, userWidget.meta.id, 'dimensions', newDimensions);

            },
            stop: function(e, ui){
                // not super important to update as you resize so just do it at the end
                miniNav.updateMiniNavInnerWidgetSizes(userWidget, currentZoom);
                grid.setUpGrid();

            }
        });

    };

    var makeWorkSurfaceDroppableToWidgets = function(workSurface, outermostWidget){
        var onDropFinished = function(dragHandle, widget){

            var widgetId = widget.meta.id;

            if (dragHandle.associated){
                var parent = outermostWidget.getInnerWidget(widgetId, true);
                if (parent.meta.id == outermostWidget.meta.id){ // fixme SUPERHACK :'(
                    shiftOrder(widgetId, outermostWidget);
                }
            }
            var firstInnerWidgetId = outermostWidget.getPath(widgetId)[1]; // this should always exist
            if (!firstInnerWidgetId){
                console.log('something went wrong in onDropFinished');
            }



            var firstInnerWidget = outermostWidget.getInnerWidget(firstInnerWidgetId);

            // var parent = widgetEditsManager.getInnerWidget(outermostWidget, widgetId, true);
            var overallStyles = widgetEditsManager.getMostRelevantOverallCustomChanges(outermostWidget, widgetId);

            // TODO this needs fixing
            // var firstInnerWidgetContainer = $("#component-container_"+firstInnerWidgetId);
            // firstInnerWidgetContainer.find('*').remove();
            // firstInnerWidgetContainer.remove();
            // $('#component-container_'+widgetId).remove();
            // that.makeRecursiveWidgetContainersAndDisplay(firstInnerWidget, outermostWidget, true, dragHandle, workSurface, overallStyles, currentZoom, true);
            loadUserWidgetIntoWorkSurface(outermostWidget, currentZoom);
            // that.makeRecursiveWidgetContainersAndDisplay(widget, outermostWidget, true, dragHandle, workSurface, outermostWidget.properties.styles.custom, currentZoom, true);
            // need the container to be placed before setting up the grid!
            grid.setUpGrid();
        };

        var dropSettings = dragAndDrop.widgetToWorkSurfaceDropSettings(outermostWidget, onDropFinished);

        //$('#outer-container').droppable(dropSettings);

        workSurface.droppable(dropSettings);
    };

    // puts componentId at the top!
    var shiftOrder = function(widgetId, outermostWidget){
        // TODO make this work for inner widgets
        var parent = outermostWidget.getInnerWidget(widgetId, true);

        var stackOrder = parent.properties.layout.stackOrder;

        var index;
        for (var i = 0; i < stackOrder.length; i++){
            var id = stackOrder[i];
            if (widgetId == id){
                index = i;
                break
            }
        }

        parent.properties.layout.stackOrder.splice(index, 1);
        parent.properties.layout.stackOrder.push(widgetId);
        widgetEditsManager.updateCustomProperties(outermostWidget, widgetId, 'stackOrder', stackOrder, true);
    };


    var findWidgetsToShift = function(movingId, otherId){// TODO better naming?
        var container = $('#'+containerRef+'_'+otherId);

        var top = container.offset().top;
        var left = container.offset().left;
        var right = left + container.width();
        var bottom = top + container.height();
        var widgetsToShift = {};
        [left, right].forEach(function(x) {
            [top, bottom].forEach(function (y) {
                var allElements = utils.allElementsFromPoint(x, y);
                var overlappingWidgets = [];
                $(allElements).filter('.'+containerRef).each(function (idx, elt) {
                    var containerId = $(elt).attr('id');
                    if (containerId != 'dragging-container') {
                        var id = widgetContainerMaker.getWidgetIdFromContainerId($(elt).attr('id'));
                        if (movingId == otherId){ // if we are looking at the moving container
                            if (!(id == movingId)) {
                                overlappingWidgets.push(id); // push in every other overlapping container
                            }
                        } else {
                            if (id == movingId){ // if we overlap with the moving container
                                overlappingWidgets.push(otherId); // push it in
                            }
                        }
                    }
                });
                overlappingWidgets.forEach(function (id) {
                    if (!(id in widgetsToShift)) {
                        widgetsToShift[id] = "";
                    }
                })
            });
        });
        return Object.keys(widgetsToShift);
    };

    that.changeOrderByOne = function(widgetId, userWidget, isUp){
        var widgetsToShift = {};
        for (var id in userWidget.innerWidgets){
            var overlappingWidgets = findWidgetsToShift(widgetId, id);
            overlappingWidgets.forEach(function(id){
                if (!(id in widgetsToShift)){
                    widgetsToShift[id] = "";
                }
            })
        }

        var stackOrder = userWidget.properties.layout.stackOrder;
        var idxThisWidget;
        var idxNextWidget;
        if (!isUp){
            stackOrder.reverse();
        }
        for (var i = 0; i<stackOrder.length; i++){
            var id = stackOrder[i];
            if (id == widgetId){
                idxThisWidget = i;
            }
            if (typeof idxThisWidget !== 'undefined'){ // 0 is considered false!
                // we have passed this component!
                if (id in widgetsToShift){
                    idxNextWidget = i;
                    break;
                }
            }
        }
        if (typeof idxNextWidget !== 'undefined') { // there is something to move
            var idxToSwap = idxThisWidget;
            // from the component after this to the next
            for (var i = idxThisWidget + 1; i < idxNextWidget + 1; i++) {
                var id = stackOrder[i];
                stackOrder[idxToSwap] = id;
                idxToSwap = i;
            }
            stackOrder[idxNextWidget] = widgetId;
        }
        if (!isUp){
            stackOrder.reverse();
        }
        userWidget.properties.layout.stackOrder = stackOrder;
        // FIXME faster implem?
        loadUserWidgetIntoWorkSurface(userWidget, currentZoom);
    };



    /**
     * enables it if its elements have already been created,
     * otherwise loads the elements into the DOM
     * @param userWidget
     * @param zoom
     */
    that.loadUserWidget = function(userWidget){
        var widgetId = userWidget.meta.id;
        var workSurface = $('#'+WIDGET_WS_REF+'_'+widgetId);
        zoomElement.registerZoom(userWidget);

        if (workSurface.length===0){
            currentZoom = 1;
            loadUserWidgetIntoWorkSurface(userWidget, currentZoom);
        } else {
            disableAllWidgetDomElementsExcept(widgetId);
            setWidgetOptions(userWidget);
            zoomElement.updateZoomFromState(userWidget);
            // TODO other way? for now, reload the thinger
            loadUserWidgetIntoWorkSurface(userWidget, currentZoom);
        }
        miniNav.setUpMiniNavElementAndInnerWidgetSizes(userWidget);
        grid.setUpGrid();
    };



    /**
     * creates an empty worksurface and appends it to the outer container
     * @param userWidget
     * @param zoom
     */
    var setUpEmptyWorkSurface = function(userWidget, zoom, editable){
        currentZoom = zoom; // set zoom value 100%
        var widgetId = userWidget.meta.id;
        disableAllWidgetDomElementsExcept(widgetId);
        var workSurface = createWorkSurface(widgetId, userWidget.properties.dimensions.height, userWidget.properties.dimensions.width);

        $('#outer-container').append(workSurface);

        resetWorkSurface(workSurface);

        if (editable){
            makeWorkSurfaceResizable(workSurface, userWidget); // TODO experimentation
        }
        makeWorkSurfaceDroppableToWidgets(workSurface, userWidget);
        zoomElement.updateZoomFromState(userWidget);

        setWidgetOptions(userWidget);

        return workSurface
    };



    /**
     * Disabled by changing the id and class names
     * @param widgetId
     */
    var disableWidgetDOMElements = function(widgetId){
        var workSurface = $('#'+WIDGET_WS_REF+'_'+widgetId);
        if (workSurface.hasClass('hidden-component')){
            return;
        }

        $(workSurface).addClass('hidden-component');

        $(workSurface).find('*').each(function() {
            var elt = this;
            
            var id = elt.id;
            if (id.length>0){
                elt.id = 'disabled_'+widgetId+'_'+elt.id;
            }
            var classes = elt.className;
            if (classes.length>0){
                classes = classes.split(' ');
                var classNames = '';
                classes.forEach(function(className){
                    classNames = classNames + ' ' + 'disabled_'+widgetId+'_'+className;
                });
                elt.className = classNames;
            }
        });
    };


    var enableWidgetDOMElements = function(widgetId){
        var workSurface = $('#'+WIDGET_WS_REF+'_'+widgetId);
        if (!workSurface.hasClass('hidden-component')){
            return;
        }
        $(workSurface).removeClass('hidden-component');

        $(workSurface).find('*').each(function() {
            var elt = this;

            var id = elt.id;
            if (id.length>0){
                elt.id = id.replace('disabled_'+widgetId+'_', '');
            }
            var classes = elt.className;
            if (classes.length>0){
                classes = classes.split(' ');
                var classNames = '';
                classes.forEach(function(className){
                    classNames =  classNames  + ' ' +  className.replace('disabled_'+widgetId+'_', '');
                });
                elt.className = classNames.trim();
            }
        });
    };

    var disableAllWidgetDomElementsExcept = function(widgetToEnableId){
        userApp.getAllWidgetIds(true).forEach(function(widgetId){
            if (widgetToEnableId == widgetId){
                enableWidgetDOMElements(widgetId);
                return;
            }
            disableWidgetDOMElements(widgetId);
        });
    };

    Object.freeze(that);
    return that
};
