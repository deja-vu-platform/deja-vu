/**
 * Created by Shinjini on 9/26/2016.
 */

var widgetContainerMaker = WidgetContainer();

var WorkSurface = function(){
    var that = Object.create(WorkSurface.prototype);


    var createWorkSurface = function(outerWidgetId, height, width){
        var workSurface = $('<div></div>');
        workSurface.addClass('work-surface');
        workSurface.attr('id', 'work-surface_'+outerWidgetId);

        workSurface.height(height).width(width);
        return workSurface;
    };

    var createOrResetWorkSurface = function(outerWidget, zoom){
        var widgetId = outerWidget.meta.id;
        var workSurface = $('#work-surface'+'_'+widgetId);
        if (workSurface.length===0){
            workSurface = that.setUpEmptyWorkSurface(outerWidget, zoom);
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
        workSurface.find('.component-container').remove();
    };

    that.makeRecursiveWidgetContainersAndDisplay = function(innerWidget, outerWidget, isThisEditable, dragHandle,
                                                            outerWidgetContainer, overallStyles, zoom, associated){
        var container = makeRecursiveWidgetContainers(innerWidget, outerWidget, isThisEditable, dragHandle, zoom, associated);
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
    var makeRecursiveWidgetContainers = function(innerWidget, outerWidget, isThisEditable, dragHandle, zoom, associated){
        var type = innerWidget.type;
        var widgetId = innerWidget.meta.id;

        // first create a container for this component
        var widgetContainer;
        if (isThisEditable){
            widgetContainer = widgetContainerMaker.createEditableWidgetContainer(innerWidget, outerWidget, zoom);
            if (!dragHandle){
                dragHandle = $('#basic-components .draggable[data-type=' + type + ']').clone();
                if (type == 'user'){
                    dragHandle.text(innerWidget.meta.name);
                    dragHandle.css('display', 'block');
                }
                dragHandle.addClass('associated').data('componentid', widgetId);
            }
            widgetContainerMaker.setUpContainer(widgetContainer, dragHandle, innerWidget, associated);
            registerDraggable(dragHandle);
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

                var diff = innerWidget.properties.layout.stackOrder.length - Object.keys(innerWidget.innerWidgets).length;
                if (diff != 0){
                    console.log('in make recursive containers')
                    console.log(innerWidget.properties.layout.stackOrder);
                    console.log(Object.keys(innerWidget.innerWidgets));
                    console.log(innerInnerWidget);
                }
                var innerInnerWidgetContainer = makeRecursiveWidgetContainers(innerInnerWidget, innerWidget, false, null, zoom, associated);
                widgetContainer.append(innerInnerWidgetContainer);
            });
        }
        return widgetContainer;
    };

    var refreshFromProject = function(outerWidget){

        // TODO. This is a confusing function
        // TODO. Document what's going on!!!

        // TODO This does NOT get the property changes for the inner widgets made at a previous level!
        var getPropertyChanges = function(outerWidget, path){
            // get the changes at this level
            var change = outerWidget.properties;
            for (var pathValueIdx = 1; pathValueIdx<path.length; pathValueIdx++){
                if (change.children){
                    if (change.children[path[pathValueIdx]]){
                        change = change.children[path[pathValueIdx]]
                    } else {
                        change = {};
                        break;
                    }
                } else {
                    change = {};
                    break;
                }
            }
            return change;
        };

        // gets the changes made at the level of the outer widget and
        // puts them in the properties of the involved inner widget
        // saved in the outer widget. NOTE: this does not reference the
        // templates from the project! Use this before re-id-ing the components
        var applyPropertyChanges = function(outerWidget, sourceWidget){
            var path = [];
            var applyPropertyChangesHelper = function(innerWidget, sourceInnerWidget){
                path.push(sourceInnerWidget.meta.id);
                // get changed properties
                var properties = getPropertyChanges(sourceWidget, path);

                // if there is a change, override the old one
                if (properties.styles){
                    if (properties.styles.custom){
                        var customStyles = properties.styles.custom;
                        for (var style in customStyles) {
                            innerWidget.properties.styles.custom[style] = customStyles[style];
                        }
                    }
                }

                if (innerWidget.type == 'user'){
                    innerWidget.properties.layout.stackOrder.forEach(function (innerInnerWidgetId, idx) {
                        var innerInnerWidget = innerWidget.innerWidgets[innerInnerWidgetId];
                        var innerInnerSourceWidgetId = sourceInnerWidget.properties.layout.stackOrder[idx];
                        var innerInnerSourceWidget = sourceInnerWidget.innerWidgets[innerInnerSourceWidgetId];
                        applyPropertyChangesHelper(innerInnerWidget, innerInnerSourceWidget);
                    });
                }
                path.pop();
            };
            applyPropertyChangesHelper(outerWidget, sourceWidget);

        };

        // goes down each level recursively.
        // As it goes up, it reads from the source code (Project) to override changes
        var recursiveWidgetMaking = function(widget){
            if (widget.type == 'user') {
                // path.push(widget.meta.id);
                widget.properties.layout.stackOrder.forEach(function (innerWidgetId) {
                    var innerWidget = widget.innerWidgets[innerWidgetId];
                    if (innerWidget.type == 'user') { // TODO FIXME doing some sketchy shit here
                        // var customStyles = innerWidget.properties.styles.custom;
                        var templateId = innerWidget.meta.templateId;
                        var projectComponentCopy = UserWidget.fromString(
                            JSON.stringify(selectedProject.components[templateId])
                        );

                        innerWidget =  createUserWidgetCopy(UserWidget.fromString(
                                JSON.stringify(selectedProject.components[templateId])
                        ));

                        innerWidget.meta.id = innerWidgetId;
                        innerWidget.meta.templateId = templateId;

                        // do it after the id and templateId are overwritten
                        innerWidget = recursiveWidgetMaking(innerWidget);

                        applyPropertyChanges(innerWidget, projectComponentCopy);

                        widget.innerWidgets[innerWidgetId] = innerWidget;
                    } else {
                        applyPropertyChanges(innerWidget, innerWidget);
                    }

                    // at this point, the inner widget and its inner widgets, recursively, are copies
                    // of their respective templates, and also have all the property changes recursively updated
                    // at this point. We need to update each inner widget which has had its properties changed
                    // at THIS level

                    // get the path to this widget
                    // path.push(innerWidgetId);

                    // get changed properties
                    // var properties = getPropertyChanges(outerWidget, path);
                    // path.pop();
                    //
                    // // if there is a change, override the old one
                    // if (properties.styles){
                    //     if (properties.styles.custom){
                    //         var customStyles = properties.styles.custom;
                    //         for (var style in customStyles) {
                    //             innerWidget.properties.styles.custom[style] = customStyles[style];
                    //         }
                    //     }
                    // }
                    innerWidget.parentId = widget.meta.id;
                });
                // path.pop();
            } else {
                // else it's a base component, so we'll just take it as is from the component we are reading from
            }
            return widget
        };

        // var originalId = outerWidget.meta.id;
        // var reIDedCopy = createUserWidgetCopy(recursiveWidgetMaking(outerWidget));
        // reIDedCopy.meta.id = originalId;
        // selectedUserWidget = reIDedCopy;
        // // TODO this seems sketchy
        // selectedProject.components[originalId] = selectedUserWidget;

        var recursiveWidget = recursiveWidgetMaking(outerWidget);
        applyPropertyChanges(recursiveWidget, outerWidget);

        // return recursiveWidgetMaking(outerWidget);
        return recursiveWidget
    };
    //
    // var recursiveWidgetMaking = function(widget){
    //     if (widget.type == 'user') {
    //         widget.properties.layout.stackOrder.forEach(function (innerWidgetId) {
    //             var innerWidget = widget.innerWidgets[innerWidgetId];
    //             if (innerWidget.type == 'user') { // TODO FIXME doing some sketchy shit here
    //                 var customStyles = innerWidget.properties.styles.custom;
    //                 var templateId = innerWidget.meta.templateId;
    //                 innerWidget = recursiveWidgetMaking(
    //                     createUserWidgetCopy(
    //                         UserWidget.fromString(
    //                             JSON.stringify(selectedProject.components[templateId])
    //                         )
    //                     )
    //                 );
    //                 innerWidget.meta.id = innerWidgetId;
    //                 innerWidget.meta.templateId = templateId;
    //                 for (var style in customStyles) {
    //                     innerWidget.properties.styles.custom[style] = customStyles[style];
    //                 }
    //                 widget.innerWidgets[innerWidgetId] = innerWidget;
    //             }
    //         });
    //     }
    //     return widget
    // };

    /**
     * Loads elements into the DOM. If the elements were already there, gets rid of them
     * and creates them afresh.
     * @param userWidget
     * @param zoom
     */
    var loadUserWidgetIntoWorkSurface = function(userWidget, zoom){
        var workSurface = createOrResetWorkSurface(userWidget, zoom);

        var diff = userWidget.properties.layout.stackOrder.length - Object.keys(userWidget.innerWidgets).length;
        if (diff != 0){
            console.log('in load user widget into worksurface');
            console.log(userWidget.properties.layout.stackOrder);
            console.log(Object.keys(userWidget.innerWidgets));
            console.log(userWidget);
        }

        userWidget = refreshFromProject(userWidget);

        userWidget.properties.layout.stackOrder.forEach(function(innerWidgetId){
            var innerWidget = userWidget.innerWidgets[innerWidgetId];
            var overallStyles = userWidget.properties.styles.custom;
            that.makeRecursiveWidgetContainersAndDisplay(innerWidget, userWidget, true, null, workSurface, overallStyles, zoom, true);
        });
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
                // var minWidth = $('.grid-cell:last').position().left;
                // var minHeight = $('.grid-cell:last').position().top;

                var minWidth = grid.getRightMostGridPosition();
                var minHeight = grid.getBottomMostGridPosition();


                $(this).resizable('option', 'minWidth', minWidth);
                $(this).resizable('option', 'minHeight', minHeight);
            },
            resize: function(e, ui){
                userWidget.properties.dimensions.height = ui.size.height/currentZoom;
                userWidget.properties.dimensions.width = ui.size.width/currentZoom;
            },
            stop: function(e, ui){
                // not super important to update as you resize so just do it at the end
                miniNav.updateMiniNavInnerWidgetSizes(userWidget, currentZoom);
                grid.setUpGrid();

            }
        });

    };

    var makeWorkSurfaceDroppableToWidgets = function(workSurface, userWidget){
        var onDropFinished = function(dragHandle, widget){
            if (dragHandle.associated){
                shiftOrder(widget.meta.id, userWidget);
            }
            that.makeRecursiveWidgetContainersAndDisplay(widget, userWidget, true, dragHandle, workSurface, userWidget.properties.styles.custom, currentZoom, true);
            // need the container to be placed before setting up the grid!
            grid.setUpGrid();
        };

        var dropSettings = dragAndDrop.widgetToWorkSurfaceDropSettings(userWidget, onDropFinished);

        workSurface.droppable(dropSettings);
    };

    // puts componentId at the top!
    var shiftOrder = function(widgetId, userWidget){
        var stackOrder = userWidget.properties.layout.stackOrder;

        var index;
        for (var i = 0; i < stackOrder.length; i++){
            var id = stackOrder[i];
            if (widgetId == id){
                index = i;
                break
            }
        }
        userWidget.properties.layout.stackOrder.splice(index, 1);
        userWidget.properties.layout.stackOrder.push(widgetId);
    };


    // from http://stackoverflow.com/questions/8813051/determine-which-element-the-mouse-pointer-is-on-top-of-in-javascript
    var allElementsFromPoint = function(x, y) {
        var element, elements = [];
        var oldVisibility = [];
        while (true) {
            element = document.elementFromPoint(x, y);
            if (!element || element === document.documentElement) {
                break;
            }
            elements.push(element);
            oldVisibility.push(element.style.visibility);
            element.style.visibility = 'hidden'; // Temporarily hide the element (without changing the layout)
        }
        for (var k = 0; k < elements.length; k++) {
            elements[k].style.visibility = oldVisibility[k];
        }
        elements.reverse();
        return elements;
    };

    var findWidgetsToShift = function(movingId, otherId){// TODO better naming?
        var container = $('#component-container_'+otherId);

        var top = container.offset().top;
        var left = container.offset().left;
        var right = left + container.width();
        var bottom = top + container.height();
        var widgetsToShift = {};
        [left, right].forEach(function(x) {
            [top, bottom].forEach(function (y) {
                var allElements = allElementsFromPoint(x, y);
                var overlappingWidgets = [];
                $(allElements).filter('.component-container').each(function (idx, elt) {
                    var containerId = $(elt).attr('id');
                    if (containerId != 'dragging-container') {
                        var id = getWidgetIdFromContainerId($(elt).attr('id'));
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
        var workSurface = $('#work-surface'+'_'+widgetId);
        zoomElement.registerZoom(selectedUserWidget);

        if (workSurface.length===0){
            currentZoom = 1;
            loadUserWidgetIntoWorkSurface(userWidget, currentZoom);
        } else {
            disableAllWidgetDomElementsExcept(widgetId);
            setWidgetOptions(userWidget);
            zoomElement.updateZoomFromState(userWidget);
            // for now, reload the thinger
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
    that.setUpEmptyWorkSurface = function(userWidget, zoom){
        currentZoom = zoom; // set zoom value 100%
        var widgetId = userWidget.meta.id;
        disableAllWidgetDomElementsExcept(widgetId);
        var workSurface = createWorkSurface(widgetId, userWidget.properties.dimensions.height, userWidget.properties.dimensions.width);

        $('#outer-container').append(workSurface);

        resetWorkSurface(workSurface);

        makeWorkSurfaceResizable(workSurface, userWidget); // TODO experimentation
        makeWorkSurfaceDroppableToWidgets(workSurface, userWidget);
        zoomElement.updateZoomFromState(userWidget);

        setWidgetOptions(selectedProject.components[widgetId]);

        return workSurface
    };


    Object.freeze(that);
    return that
};
