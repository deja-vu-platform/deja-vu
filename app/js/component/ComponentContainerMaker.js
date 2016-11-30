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
                setUpGrid();
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


    var createEditOptions = function(component, container){
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

        buttonEdit.attr('id', 'edit-btn' + '_' + component.meta.id);


        var buttonStyle = $('<li class="dropdown-submenu">'+
                                '<a tabindex="-1" href="#" class="inner-component-style">Style</a>'+
                                '<ul class="dropdown-menu inner-component-style-dropdown">'+
                                    '<li class="dropdown-submenu">'+
                                        '<a tabindex="-1" href="#" class="inner-component-custom-style">Custom</a>'+
                                        '<ul class="dropdown-menu inner-component-custom-style-dropdown">'+
                                        '</ul>'+
                                    '</li>'+
                                    '<li class="dropdown-submenu">'+
                                        '<a tabindex="-1" href="#" class="inner-component-premade-style">Premade</a>'+
                                        '<ul class="dropdown-menu inner-component-premade-style-dropdown">'+
                                        '</ul>'+
                                    '</li>'+
                                '</ul>'+
                            '</li>');



        var buttonTrash = $('<li>' +
            '<a href="#" class="inner-component-trash">' +
            '<span class="glyphicon glyphicon-trash"></span>' +
            '</a>' +
            '</li>');

        buttonTrash.attr('id', 'inner-component-trash' + '_' + component.meta.id);

        optionsDropdown.find('.dropdown-menu')
            .append(buttonEdit)
            .append('<li class="divider"></li>')
            .append(buttonStyle)
            .append('<li class="divider"></li>')
            .append(buttonTrash);

        // behaviour

        optionsDropdown.find('.inner-component-options-dropdown, .inner-component-style,' +
            ' .inner-component-custom-style, .inner-component-premade-style').each(function(idx, elt){
            console.log(elt);
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
            deleteComponentFromUserComponentAndFromView(component.meta.id)
        });

        return optionsDropdown;
    };


    that.createComponentContainer = function(component, zoom) {
        var container = $('<div></div>');
        var containerId = 'component-container_'+component.meta.id;
        container.addClass('cell dropped component-container containing-cell').attr('id', containerId);
        container.height(component.dimensions.height * zoom).width(component.dimensions.width * zoom);
        container.data('componentId', component.meta.id);

        makeContainerResizable(container, component);
        container.append(createEditOptions(component, container));
        return container;
    };

    var setUpColorOptions = function(container, component){
        if (!component.properties.custom){
            component.properties.custom = {}
        }

        var customStyles = component.properties.custom;
        var textColorOption = $('<li><div>Text Color: </div></li>');
        var bgColorOption = $('<li><div>Background Color: </div></li>');
        var textColorInput = $('<input id="pick-color-inner-text-input" class="color-input">');
        var bgColorInput = $('<input id="pick-color-inner-bg-input" class="color-input">');
        textColorOption.append(textColorInput);
        bgColorOption.append(bgColorInput);


        var pickerText = new jscolor(textColorInput[0]);
        pickerText.closable = true;
        pickerText.closeText = 'X';
        textColorInput.change(function(e){
            // e.stopPropagation();
            // container.find('.inner-component-options-small').addClass('open');
            var color = pickerText.toHEXString();
            component.properties.custom['color'] = color;
            refreshContainerDisplay(container.attr('id'), currentZoom);
        });

        var pickerBG = new jscolor(bgColorInput[0]);
        pickerBG.closable = true;
        pickerBG.closeText = 'X';
        bgColorInput.change(function(e){
            // e.stopPropagation();
            // container.find('.inner-component-options-small').addClass('open');
            var color = pickerBG.toHEXString();
            component.properties.custom['background-color'] = color;
            refreshContainerDisplay(container.attr('id'), currentZoom);
        });

        var textColor = customStyles['color'] || '000000'; // TODO
        pickerText.fromString(textColor);

        var bgColor = customStyles['background-color'] || 'FFFFFF'; // TODO
        pickerBG.fromString(bgColor);

        // colorOptions.append(textColorInput).append(bgColorInput);
        // container.find('.config-btns').append(colorOptions);
        container.find('.inner-component-custom-style-dropdown').append(textColorOption).append(bgColorOption);
    };

    var showConfigOptions = function(droppedComponentType, container) {
        // Hide edit button if label or panel
        if (droppedComponentType=='label' || droppedComponentType=='panel') {
            container.find('.edit-btn').css('display', 'none');
        } else {
            container.find('.edit-btn').css('display', 'block');
        }

        var labelProperties = $('.default-properties').find('.'+droppedComponentType+'-properties').clone();

        if (labelProperties.length==0) {
            return;
        }
        var configOptions = labelProperties.find('.config-btns');

        configOptions.children().each(function(idx, elt){
            var li = $('<li class="dropdown-submenu"></li>');
            li.append($(elt).children());
            li.find('.dropdown-toggle').click(function(e){
                var thisLi = li;
                toggleOpenClose(e, thisLi);
            });
            li.find('.premade-style').click(function(e){
                e.stopPropagation();
            });

            container.find('.inner-component-premade-style-dropdown').append(li);
        });
        container.find('.inner-component-style-dropdown').append(configOptions);
    };


    that.setUpContainer = function(container, widget, component, zoom){
        container.append(widget);
        var type = widget.attr('name');
        var properties;
        if (component){
            var html = view.getHTML(type)(component.components[type]);
            component.properties.overall = selectedUserComponent.properties.custom;
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
