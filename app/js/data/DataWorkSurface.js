/**
 * Created by Shinjini on 9/26/2016.
 */

var dataContainerMaker = DataContainer();

var DataWorkSurface = function(){
    var that = Object.create(DataWorkSurface.prototype);

    var DATA_WS_ID = 'data-work-surface';

    // takes in a component object and the id of the selected datatype, and does
    // any work based on the data you obtain from the component

    that.getWorkSurfaceRef = function(){
        return DATA_WS_ID;
    };

    var createWorkSurface = function(datatypeId, height, width){
        var workSurface = $('<div></div>');
        workSurface.addClass(DATA_WS_ID).addClass('work-surface');
        workSurface.attr('id', DATA_WS_ID+'_'+datatypeId);

        workSurface.height(height).width(width);
        return workSurface;
    };

    var createOrResetWorkSurface = function(datatype, zoom){
        var datatypeId = datatype.meta.id;
        var workSurface = $('#'+DATA_WS_ID+'_'+datatypeId);
        if (workSurface.length===0){
            workSurface = that.setUpEmptyWorkSurface(datatype, zoom);
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

    var loadClicheWorkSurface = function(cliche, zoom, focusDatatype){ // TODO should input a Project
        var workSurface = createOrResetWorkSurface(cliche, zoom);


        var dragHandle = $('#basic-components .draggable[data-type=' + 'user' + ']').clone();
        dragHandle.text(cliche.meta.name);
        dragHandle.css('display', 'block');

        var displayPropObj = cliche.datatypeDisplays[cliche.meta.id];
        var container = that.makeDatatypeContainers(cliche.meta.id, cliche.meta.id, displayPropObj, dragHandle, zoom);
        workSurface.append(container);
        dataDragAndDrop.registerDataDragHandleDraggable(dragHandle);

        for (var datatypeId in cliche.datatypes){
            var datatype = cliche.datatypes[datatypeId];

            var dragHandle = $('#basic-components .draggable[data-type=' + 'user' + ']').clone();
            dragHandle.text(datatype.meta.name);
            dragHandle.css('display', 'block');

            var displayPropObj = cliche.datatypeDisplays[datatypeId];
            var container = that.makeDatatypeContainers(cliche.meta.id, datatypeId, displayPropObj, dragHandle, zoom);
            workSurface.append(container);
            dataDragAndDrop.registerDataDragHandleDraggable(dragHandle);
        }

        canvas.drawClicheDataLines([{clicheId:cliche.meta.id, dataIds: Object.keys(cliche.datatypes)}]);
    };


    that.makeDatatypeContainers = function(clicheId, datatypeId, displayPropObj, dragHandle, zoom){

        dragHandle.addClass('associated').data('componentid', datatypeId).data('clicheid', clicheId);
        var container = dataContainerMaker.createResizableDatatypeContainer(clicheId, datatypeId, displayPropObj, zoom);
        container.css({
            position: 'absolute',
            top: displayPropObj.displayProperties.position.top,
            left: displayPropObj.displayProperties.position.left,
        });
        dataContainerMaker.setUpContainer(container, dragHandle);
        return container;
    };

    /**
     * Loads elements into the DOM. If the elements were already there, gets rid of them
     * and creates them afresh.
     * @param userWidget
     * @param zoom
     */
    var loadDatatypeIntoWorkSurface = function(userWidget, zoom){
        var workSurface = createOrResetWorkSurface(userWidget, zoom);

        var diff = userWidget.properties.layout.stackOrder.length - Object.keys(userWidget.innerWidgets).length;
        if (diff != 0){
            console.log('in load user widget into worksurface');
            console.log(userWidget.properties.layout.stackOrder);
            console.log(Object.keys(userWidget.innerWidgets));
            console.log(userWidget);
        }

        userWidget = dataEditsManager.refreshFromProject(userWidget);

        userWidget.properties.layout.stackOrder.forEach(function(innerWidgetId){
            var innerWidget = userWidget.innerWidgets[innerWidgetId];
            var overallStyles = userWidget.properties.styles.custom;
            that.makeRecursiveWidgetContainersAndDisplay(innerWidget, userWidget, true, null, workSurface, overallStyles, zoom, true);
        });
    };


    var makeWorkSurfaceDroppableToWidgets = function(workSurface, outermostWidget){
        var onDropFinished = function(dragHandle, datatype){

            var datatypeId = datatype.meta.id;
            var displayPropObj = userApp.datatypeDisplays[datatypeId];
            var container = that.makeDatatypeContainers(userApp.meta.id, datatypeId, displayPropObj, dragHandle, currentZoom);
            workSurface.append(container);

            canvas.drawClicheDataLines([{clicheId:userApp.meta.id, dataIds: Object.keys(userApp.datatypes)}]) // TODO dry
        };

        var dropSettings = dataDragAndDrop.dataToWorkSurfaceDropSettings(outermostWidget, onDropFinished);

        workSurface.droppable(dropSettings);
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


    /**
     * enables it if its elements have already been created,
     * otherwise loads the elements into the DOM
     * @param userWidget
     * @param zoom
     */
    that.loadDatatype = function(component, datatypeId){
        if (datatype){
            var datatype = component.datatypes[datatypeId];
            var workSurface = $('#'+DATA_WS_ID+'_'+datatypeId);
            dataZoomElement.registerZoom(datatype);

            if (workSurface.length===0){
                currentZoom = 1;
                loadDatatypeIntoWorkSurface(datatype, currentZoom);
            } else {
                disableAllDataDomElementsExcept(datatypeId);
                //setWidgetOptions(datatype);
                //dataZoomElement.updateZoomFromState(datatype);
                // TODO other way? for now, reload the thinger
                // loadDatatypeIntoWorkSurface(datatype, currentZoom);
            }

        } else {
            // load all the stuff
            var componentId = component.meta.id;
            var workSurface = $('#'+DATA_WS_ID+'_'+componentId);
            //dataZoomElement.registerZoom(datatype);

            if (workSurface.length===0){
                currentZoom = 1;
                loadClicheWorkSurface(component, currentZoom);
            } else {
                disableAllDataDomElementsExcept(componentId);
                // setDatatypeOptions(datatype);
                //dataZoomElement.updateZoomFromState(datatype);
                // TODO other way? for now, reload the thinger
                // loadAllDatatypesIntoOverallWorkSurface(component, currentZoom);
            }
        }

        //dataMiniNav.setUpMiniNavElementAndInnerWidgetSizes(datatype);
        //grid.setUpGrid();
    };



    /**
     * creates an empty worksurface and appends it to the outer container
     * @param datatype
     * @param zoom
     */
    that.setUpEmptyWorkSurface = function(datatype, zoom){
        currentZoom = zoom; // set zoom value 100%
        var datatypeId = datatype.meta.id;
        disableAllDataDomElementsExcept(datatypeId);
        var workSurface = createWorkSurface(datatypeId, selectedScreenSizeHeight, selectedScreenSizeWidth);

        $('#outer-container').append(workSurface);

        resetWorkSurface(workSurface);

        makeWorkSurfaceDroppableToWidgets(workSurface, datatype);
        //dataZoomElement.updateZoomFromState(datatype);

        // setDatatypeOptions(selectedProject.cliches[datatypeId]);

        return workSurface
    };



    /**
     * Disabled by changing the id and class names
     * @param widgetId
     */
    var disableWidgetDOMElements = function(widgetId){
        var workSurface = $('#'+DATA_WS_ID+'_'+widgetId);
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


    var enableDataDOMElements = function(dataId){
        var workSurface = $('#'+DATA_WS_ID+'_'+dataId);
        $(workSurface).removeClass('hidden-component');

        $(workSurface).find('*').each(function() {
            var elt = this;

            var id = elt.id;
            if (id.length>0){
                elt.id = id.replace('disabled_'+dataId+'_', '');
            }
            var classes = elt.className;
            if (classes.length>0){
                classes = classes.split(' ');
                var classNames = '';
                classes.forEach(function(className){
                    classNames =  classNames  + ' ' +  className.replace('disabled_'+dataId+'_', '');
                });
                elt.className = classNames.trim();
            }
        });
    };

    var disableAllDataDomElementsExcept = function(dataToEnableId){
        // TODO this also needs to disable the overall component
        userApp.getAllDatatypeIds().forEach(function(dataId){
            if (dataToEnableId == dataId){
                enableDataDOMElements(dataId);
                return;
            }
            if ($('#'+DATA_WS_ID+'_'+dataId).hasClass('hidden-component')){
                return;
            }
            disableWidgetDOMElements(dataId);
        })
    };

    Object.freeze(that);
    return that
};
