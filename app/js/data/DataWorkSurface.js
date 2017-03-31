/**
 * Created by Shinjini on 9/26/2016.
 */

var dataContainerMaker = DataContainer();

var DataWorkSurface = function(){
    var that = Object.create(DataWorkSurface.prototype);

    var DATA_WS_ID = 'data-work-surface';

    // takes in a component object and the id of the selected datatype, and does
    // any work based on the data you obtain from the component
    var containerRef = dataContainerMaker.getContainerRef();
    that.getWorkSurfaceRef = function(){
        return DATA_WS_ID;
    };

    var createWorkSurface = function(wsId, height, width){
        var workSurface = $('<div></div>');
        workSurface.addClass(DATA_WS_ID).addClass('work-surface');
        workSurface.attr('id', DATA_WS_ID+'_'+wsId);

        workSurface.height(height).width(width);
        return workSurface;
    };

    var getWorkSurfaceId = function(cliche){
        if (cliche){
            return cliche.meta.id
        } else {
            return selectedProject.meta.id
        }
    };

    var createOrResetWorkSurface = function(cliche, zoom){
        var wsId = getWorkSurfaceId(cliche);
        var workSurface = $('#'+DATA_WS_ID+'_'+wsId);
        if (workSurface.length == 0){
            workSurface = that.setUpEmptyWorkSurface(cliche, zoom);
        } else {
            disableAllDataDomElementsExcept(wsId);
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

    var loadClicheToWorkSurface = function(workSurface, cliche, focusDatatype, isOverall, zoom){
        var dragHandle = $('#basic-components .draggable[data-type=' + 'user' + ']').clone();
        dragHandle.text(cliche.meta.name);
        dragHandle.css('display', 'block');

        var displayPropObj;
        // TODO dry
        if (isOverall){
            displayPropObj = selectedProject.bondDisplays[cliche.meta.id].dataBondDisplays[cliche.meta.id];

        } else {
            displayPropObj = cliche.dataBondDisplays[cliche.meta.id];
        }
        var container = that.makeContainer(cliche.meta.id, cliche.meta.id, displayPropObj, dragHandle, zoom, isOverall);
        workSurface.append(container);
        dataDragAndDrop.registerDataDragHandleDraggable(dragHandle);

        for (var datatypeId in cliche.datatypes){
            var datatype = cliche.datatypes[datatypeId];

            var dragHandle = $('#basic-components .draggable[data-type=' + 'user' + ']').clone();
            dragHandle.text(datatype.meta.name);
            dragHandle.css('display', 'block');

            if (isOverall){
                var displayPropObj = selectedProject.bondDisplays[cliche.meta.id].dataBondDisplays[datatypeId];

            } else {
                var displayPropObj = cliche.dataBondDisplays[datatypeId];
            }
            var container = that.makeContainer(cliche.meta.id, datatypeId, displayPropObj, dragHandle, zoom, isOverall);
            workSurface.append(container);
            dataDragAndDrop.registerDataDragHandleDraggable(dragHandle);
        }

        canvas.drawClicheDataLines(cliche);
    };


    that.makeContainer = function(clicheId, datatypeId, displayPropObj, dragHandle, zoom, isOverall){
        dragHandle.addClass('associated').data('componentid', datatypeId).data('clicheid', clicheId);
        var container = dataContainerMaker.createResizableDatatypeContainer(clicheId, datatypeId, displayPropObj, zoom, isOverall);
        container.css({
            position: 'absolute',
            top: displayPropObj.displayProperties.position.top,
            left: displayPropObj.displayProperties.position.left,
        });
        dataContainerMaker.setUpContainer(container, dragHandle);
        return container;
    };

    var makeWorkSurfaceDroppable = function(workSurface, cliche){
        var isOverall = cliche? false: true;

        var onDropFinished = function(dragHandle, droppedObjectCliche, droppedObject){
            var droppedObjId = droppedObject.meta.id;
            if (!cliche){
                var displayPropObj = selectedProject.bondDisplays[droppedObjectCliche.meta.id].dataBondDisplays[droppedObjId];
            } else {
                var displayPropObj = droppedObjectCliche.dataBondDisplays[droppedObjId];
            }
            var container = that.makeContainer(droppedObjectCliche.meta.id, droppedObjId, displayPropObj,
                dragHandle, currentZoom, isOverall);
            workSurface.append(container);

            canvas.drawClicheDataLines(droppedObjectCliche);
        };

        var dropSettings = dataDragAndDrop.dataToWorkSurfaceDropSettings(cliche, onDropFinished);

        workSurface.droppable(dropSettings);
    };

    /**
     * enables it if its elements have already been created,
     * otherwise loads the elements into the DOM
     * @param userWidget
     * @param zoom
     */
    that.loadBondingData = function(cliche, datatype, zoom){
        //var workSurface = $('#'+DATA_WS_ID+'_'+componentId);
        currentZoom = 1;
        var workSurface = createOrResetWorkSurface(cliche, zoom);
        if (cliche){
            loadClicheToWorkSurface(workSurface, cliche, datatype, false, currentZoom);
        } else { // overall
            for (var clicheId in selectedProject.cliches){
                var cliche = selectedProject.cliches[clicheId];
                loadClicheToWorkSurface(workSurface, cliche, null, true, currentZoom);
            }
        }
    };



    /**
     * creates an empty worksurface and appends it to the outer container
     * @param component
     * @param zoom
     */
    that.setUpEmptyWorkSurface = function(cliche, zoom){
        currentZoom = zoom; // set zoom value 100%
        var wsId = getWorkSurfaceId(cliche);

        disableAllDataDomElementsExcept(wsId);
        var workSurface = createWorkSurface(wsId, selectedScreenSizeHeight, selectedScreenSizeWidth);

        $('#outer-container').append(workSurface);

        resetWorkSurface(workSurface);

        makeWorkSurfaceDroppable(workSurface, cliche);
        //dataZoomElement.updateZoomFromState(datatype);

        // setDatatypeOptions(selectedProject.cliches[datatypeId]);

        return workSurface
    };



    /**
     * Disabled by changing the id and class names
     * @param objectId
     */
    var disableDataDOMElements = function(objectId){
        var workSurface = $('#'+DATA_WS_ID+'_'+objectId);
        if (workSurface.hasClass('hidden-component')){
            return;
        }
        workSurface.addClass('hidden-component');

        workSurface.find('*').each(function() {
            var elt = this;
            
            var id = elt.id;
            if (id.length>0){
                elt.id = 'disabled_'+objectId+'_'+elt.id;
            }
            var classes = elt.className;
            if (classes.length>0){
                classes = classes.split(' ');
                var classNames = '';
                classes.forEach(function(className){
                    classNames = classNames + ' ' + 'disabled_'+objectId+'_'+className;
                });
                elt.className = classNames;
            }
        });
    };


    var enableDataDOMElements = function(objectId){
        var workSurface = $('#'+DATA_WS_ID+'_'+objectId);
        if (!workSurface.hasClass('hidden-component')){
            return;
        }

        $(workSurface).removeClass('hidden-component');

        $(workSurface).find('*').each(function() {
            var elt = this;

            var id = elt.id;
            if (id.length>0){
                elt.id = id.replace('disabled_'+objectId+'_', '');
            }
            var classes = elt.className;
            if (classes.length>0){
                classes = classes.split(' ');
                var classNames = '';
                classes.forEach(function(className){
                    classNames =  classNames  + ' ' +  className.replace('disabled_'+objectId+'_', '');
                });
                elt.className = classNames.trim();
            }
        });
    };

    var disableAllDataDomElementsExcept = function(objectId){
        // TODO this also needs to disable the overall component
        disableDataDOMElements(selectedProject.meta.id);
        for (var clicheId in selectedProject.cliches){
            disableDataDOMElements(clicheId);
        }
        enableDataDOMElements(objectId);
    };

    Object.freeze(that);
    return that
};
