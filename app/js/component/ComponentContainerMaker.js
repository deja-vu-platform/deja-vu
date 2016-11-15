/**
 * Created by Shinjini on 11/3/2016.
 */

var ComponentContainerMaker = function(){
    var that = Object.create(ComponentContainerMaker);


    var makeContainerResizable = function(container, component){
        var componentId = component.meta.id;

        var dragHandle_se = $('<span></span>');
        dragHandle_se.html('<img src="images/drag_handle_se_icon.png" width="15px" height="15px">');
        dragHandle_se.addClass('ui-resizable-handle ui-resizable-se drag-handle');
        dragHandle_se.attr('id', 'drag-handle-se' + '_' + componentId);

        var dragHandle_sw = $('<span></span>');
        dragHandle_sw.html('<img src="images/drag_handle_sw_icon.png" width="15px" height="15px">');
        dragHandle_sw.addClass('ui-resizable-handle ui-resizable-sw drag-handle');
        dragHandle_sw.attr('id', 'drag-handle-sw' + '_' + componentId);

        var dragHandle_ne = $('<span></span>');
        dragHandle_ne.html('<img src="images/drag_handle_ne_icon.png" width="15px" height="15px">');
        dragHandle_ne.addClass('ui-resizable-handle ui-resizable-ne drag-handle');
        dragHandle_ne.attr('id', 'drag-handle-se' + '_' + componentId);

        var dragHandle_nw = $('<span></span>');
        dragHandle_nw.html('<img src="images/drag_handle_nw_icon.png" width="15px" height="15px">');
        dragHandle_nw.addClass('ui-resizable-handle ui-resizable-nw drag-handle');
        dragHandle_nw.attr('id', 'drag-handle-nw' + '_' + componentId);

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
                component.dimensions.height = ui.size.height/currentZoom;
                component.dimensions.width = ui.size.width/currentZoom;
                // TODO woah! It resizes as you go!
                refreshContainerDisplay(container.attr('id'), currentZoom);
            },
            stop: function(e, ui){
                // not super important to update as you resize so just do it at the end
                miniNav.updateMiniNavInnerComponentSizes(currentZoom);

                $('.grid').css({
                    visibility: 'hidden'
                });
            }
        });
    };

    that.createComponentContainer = function(component, zoom) {
        var container = $('<div></div>');
        var containerId = 'component-container_'+component.meta.id;
        container.addClass('cell dropped component-container containing-cell').attr('id', containerId);
        container.height(component.dimensions.height * zoom).width(component.dimensions.width * zoom);
        container.data('componentId', component.meta.id);

        makeContainerResizable(container, component);

        var optionsDropdown = $('<div class="dropdown inner-component-options-small">'+
            '<button class="btn btn-default dropdown-toggle btn-xs" type="button" data-toggle="dropdown">'+
            '<span class="glyphicon glyphicon-option-vertical"></span></button>'+
            '<ul class="dropdown-menu">'+
            '</ul>'+
            '</div>');

        var buttonEdit = $('<li>' +
            '<a href="#" class="edit-btn">' +
            '<span class="glyphicon glyphicon-pencil"></span>' +
            '</a>' +
            '</li>');

        buttonEdit.attr('id', 'edit-btn' + '_' + component.meta.id);

        buttonEdit.on("click", function (e) {
            container.find('.tooltip').addClass('open');
        });

        var buttonTrash = $('<li>' +
            '<a href="#" class="inner-component-trash">' +
            '<span class="glyphicon glyphicon-trash"></span>' +
            '</a>' +
            '</li>');

        buttonTrash.attr('id', 'inner-component-trash' + '_' + component.meta.id);

        buttonTrash.click(function(){
            deleteComponentFromUserComponentAndFromView(component.meta.id)
        });

        optionsDropdown.find('.dropdown-menu').append(buttonEdit).append('<li class="divider"></li>').append(buttonTrash);
        container.append(optionsDropdown);



        return container;
    };

    var setUpColorOptions = function(container, component){
        if (!component.properties.custom){
            component.properties.custom = {}
        }

        var customStyles = component.properties.custom;
        var overallStyles = selectedUserComponent.properties.custom;
        // var colorOptions = $('<div>'+
        //     '<span>Text</span>'+
        //     '<input id="pick-color-text-input">'+
        //     '</div>'+
        //     '<div>'+
        //     '<span>Background</span>'+
        //     '<input id="pick-color-bg-input">'+
        //     '</div>');
        var colorOptions = $('<div></div>');
        var textColorOption = $('<input id="pick-color-inner-text-input">');
        var bgColorOption = $('<input id="pick-color-inner-bg-input">');

        var pickerText = new jscolor(textColorOption[0]);
        pickerText.closable = true;
        pickerText.closeText = 'X';
        textColorOption.change(function(){
            var color = pickerText.toHEXString();
            component.properties.custom['color'] = color;
            refreshContainerDisplay(container.attr('id'), currentZoom);
        });

        var pickerBG = new jscolor(bgColorOption[0]);
        pickerBG.closable = true;
        pickerBG.closeText = 'X';
        bgColorOption.change(function(){
            var color = pickerBG.toHEXString();
            component.properties.custom['background-color'] = color;
            refreshContainerDisplay(container.attr('id'), currentZoom);
        });

        var textColor = customStyles['color'] || overallStyles['color'] || '000000';
        pickerText.fromString(textColor);

        var bgColor = customStyles['background-color'] ||  overallStyles['background-color'] || 'FFFFFF';
        pickerBG.fromString(bgColor);


        colorOptions.append(textColorOption).append(bgColorOption);
        container.find('.config-btns').append(colorOptions);
    };

    that.setUpContainer = function(container, widget, component, zoom){
        container.append(widget);
        var type = widget.attr('name');
        var properties;
        if (component){
            var html = view.getHTML(type)(component.components[type]);
            if (!component.properties.custom['color']){
                component.properties.custom['color'] = selectedUserComponent.properties.custom['color'];
            }
            if (!component.properties.custom['background-color']){
                component.properties.custom['background-color'] = selectedUserComponent.properties.custom['background-color'];
            }
            properties = component.properties;
        } else {
            var html = view.getHTML(type)();
        }
        view.displayInnerComponent(container, type, html, zoom, properties);
        showConfigOptions(type, container);
        setUpColorOptions(container, component);

    };


    return that;
};
