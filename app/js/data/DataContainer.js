/**
 * Created by Shinjini on 11/3/2016.
 */

var DataContainer = function(){
    var that = Object.create(DataContainer.prototype);

    var DATA_CONT_REF = 'datatype-container';


    that.getContainerRef = function(){
        return DATA_CONT_REF;
    };

    var makeContainerResizable = function(datatype, outerWidget, container, outermostWidget){
        var widgetId = datatype.meta.id;

        var dragHandle_se = $('<span></span>');
        dragHandle_se.html('<img src="images/drag_handle_se_icon.png" width="15px" height="15px">');
        dragHandle_se.addClass('ui-resizable-handle ui-resizable-se drag-handle');
        dragHandle_se.attr('id', 'drag-handle-se' + '_' + widgetId);

        var dragHandle_sw = $('<span></span>');
        dragHandle_sw.html('<img src="images/drag_handle_sw_icon.png" width="15px" height="15px">');
        dragHandle_sw.addClass('ui-resizable-handle ui-resizable-sw drag-handle');
        dragHandle_sw.attr('id', 'drag-handle-sw' + '_' + widgetId);

        var dragHandle_ne = $('<span></span>');
        dragHandle_ne.html('<img src="images/drag_handle_ne_icon.png" width="15px" height="15px">');
        dragHandle_ne.addClass('ui-resizable-handle ui-resizable-ne drag-handle');
        dragHandle_ne.attr('id', 'drag-handle-se' + '_' + widgetId);

        var dragHandle_nw = $('<span></span>');
        dragHandle_nw.html('<img src="images/drag_handle_nw_icon.png" width="15px" height="15px">');
        dragHandle_nw.addClass('ui-resizable-handle ui-resizable-nw drag-handle');
        dragHandle_nw.attr('id', 'drag-handle-nw' + '_' + widgetId);

        container.append(dragHandle_se);
        container.append(dragHandle_sw);
        container.append(dragHandle_ne);
        container.append(dragHandle_nw);

        $(container).resizable({
            handles: {
                'se': dragHandle_se,
                'sw': dragHandle_sw,
                'ne': dragHandle_ne,
                'nw': dragHandle_nw
            },
            snap: '.grid-cell',
            snapTolerance: 10,
            start: function(){
                $('.grid').css({
                    visibility: 'visible'
                });
            },
            resize: function(e, ui){
                var newDimensions = {height: ui.size.height/currentZoom, width: ui.size.width/currentZoom};

                // widget.properties.dimensions = newDimensions;

                dataEditsManager.updateCustomProperties(outermostWidget, datatype.meta.id, 'dimensions', newDimensions);
                // TODO woah! It resizes as you go!
                refreshContainerDisplay(false, container, currentZoom);
            },
            stop: function(e, ui){
                var newPosition = {left:  ui.position.left/currentZoom, top: ui.position.top/currentZoom};
                var newLayout = {};
                newLayout[datatype.meta.id] = newPosition;
                dataEditsManager.updateCustomProperties(outermostWidget, datatype.meta.id, 'layout', newLayout, true);

                // outerWidget.properties.layout[widget.meta.id].left = ui.position.left/currentZoom;
                // outerWidget.properties.layout[widget.meta.id].top = ui.position.top/currentZoom;
                // not super important to update as you resize so just do it at the end
                dataMiniNav.updateMiniNavInnerWidgetSizes(outerWidget, currentZoom);
                grid.setUpGrid();
                $('.grid').css({
                    visibility: 'hidden'
                });
            }
        });
    };

    var toggleOpenClose = function(e, parent){
        var shouldBeOpen = (!parent.hasClass('open'));
        $(parent).parent().find('*').removeClass('open'); // close all siblings
        if (shouldBeOpen){
            parent.addClass('open');
        }
        e.stopPropagation();
    };


    var createEditOptions = function(widget, outerWidget, container, outermostWidget){
        var optionsDropdown = $('<div class="dropdown inner-component-options-small">'+
            '<button class="btn btn-default dropdown-toggle btn-xs inner-component-options-dropdown" type="button"  data-toggle="dropdown">'+
            '<span class="glyphicon glyphicon-option-vertical"></span></button>'+
            '<ul class="dropdown-menu">'+

            '</ul>'+
            '</div>');

        var buttonEdit = $('<li>' +
            '<a href="#" class="edit-btn">' +
            '<span class="glyphicon glyphicon-pencil"></span>' +
            '</a>' +
            '</li>');

        buttonEdit.attr('id', 'edit-btn' + '_' + widget.meta.id);

        var buttonTrash = $('<li>' +
            '<a href="#" class="inner-component-trash">' +
            '<span class="glyphicon glyphicon-trash"></span>' +
            '</a>' +
            '</li>');

        buttonTrash.attr('id', 'inner-component-trash' + '_' + widget.meta.id);

        optionsDropdown.find('.dropdown-menu')
            .append(buttonEdit)
            .append('<li class="divider"></li>')
            .append(buttonTrash)

        // behaviour

        optionsDropdown.find('.inner-component-options-dropdown, .inner-component-style,' +
            ' .inner-component-custom-style, .inner-component-premade-style').each(function(idx, elt){
            $(elt).click(function(e){
                var thisElt = elt;
                toggleOpenClose(e, $(thisElt).parent());
            });
        });


        buttonEdit.on("click", function (e) {
            e.stopPropagation();
            container.find('.tooltip').addClass('open');
        });


        buttonTrash.click(function(){
            deleteWidgetFromUserWidgetAndFromView(widget.meta.id)
        });


        return optionsDropdown;
    };


    that.createBasicWidgetContainer = function(widget, zoom){
        var container = $('<div></div>');
        var containerId = 'component-container_'+widget.meta.id;
        container.addClass('cell dropped component-container containing-cell').attr('id', containerId);
        container.height(widget.properties.dimensions.height * zoom).width(widget.properties.dimensions.width * zoom);
        container.data('componentId', widget.meta.id);
        return container;
    };

    that.createMinimallyEditableWidgetContainer = function(widget, outerWidget, zoom, outermostWidget) {
        var container = that.createBasicWidgetContainer(widget, zoom);
        container.append(createEditOptions(widget, outerWidget, container, outermostWidget));
        return container;
    };

    that.createEditableWidgetContainer = function(widget, outerWidget, zoom, outermostWidget) {
        var container = that.createBasicWidgetContainer(widget, zoom);
        makeContainerResizable(widget, outerWidget, container, outermostWidget);
        container.append(createEditOptions(widget, outerWidget, container, outermostWidget));
        return container;
    };

    that.setUpContainer = function(container, dragHandle, widget){
        container.append(dragHandle);
    };


    Object.freeze(that);
    return that;
};
