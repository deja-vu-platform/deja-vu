/**
 * Created by Shinjini on 3/27/2017.
 */

var WidgetListDisplay = function(){
    var that = Object.create(WidgetListDisplay.prototype);

    var recursivelyLoadWidgetIntoList = function(widget, clicheId, listElt){
        var innerWidgetsInfoList = widget.getAllInnerWidgetsIds();

        var ul = $('<ul>');

        innerWidgetsInfoList.forEach(function(innerWidgetId){
            var widgetInfo = widget.getInnerWidget(innerWidgetId).meta;
            var elt = $(
                '<li data-type="'+'user'+'" class="widget not-draggable inner-widget" data-componentid="' + widgetInfo.id + '" data-clicheid=' + clicheId + '>'
                + '<div class="component-name-container">'
                + '<span class="component-name">' + widgetInfo.name + '</span>'
                + '</div>'
                + '</li>');
            ul.append(elt);
        });
        listElt.find('.inner-widgets').append(ul);

        return ul;
    };

    that.loadClicheIntoWidgetList = function(cliche, widgetToLoadId){
        var usedWidgetsIds = cliche.getAllUsedWidgetIds();
        var userAppId = userApp.meta.id;
        if (cliche.meta.id == userAppId){
            if (widgetToLoadId in userApp.widgets.pages){
                var listElt = that.displayMainPageInListAndSelect(selectedUserWidget.meta.name, widgetToLoadId, userAppId);
            } else {
                var listElt = that.displayUserWidgetInListAndSelect(selectedUserWidget.meta.name, widgetToLoadId, userAppId);
            }

            recursivelyLoadWidgetIntoList(userApp.widgets.pages[widgetToLoadId], userAppId, listElt);

            userApp.getAllOuterWidgetIds().forEach(function(widgetId){
                if (widgetId != widgetToLoadId){
                    var widgetName;
                    if (widgetId in userApp.widgets.pages){
                        widgetName = userApp.widgets.pages[widgetId].meta.name;
                        var listElt = that.displayNewWidgetInMainPagesList(widgetName, widgetId, userAppId);
                        recursivelyLoadWidgetIntoList(userApp.widgets.pages[widgetId], userAppId, listElt);
                    } else if (widgetId in userApp.widgets.unused){
                        widgetName = userApp.widgets.unused[widgetId].meta.name;
                        var listElt = that.displayUnusedWidgetInList(widgetName, widgetId, userAppId);
                        recursivelyLoadWidgetIntoList(userApp.widgets.unused[widgetId], userAppId, listElt);
                    } else if (widgetId in userApp.widgets.templates) {
                        widgetName = userApp.widgets.templates[widgetId].meta.name;
                        that.displayNewWidgetTemplateInList(widgetName, widgetId, userAppId);
                    }

                }
            });
            usedWidgetsIds.forEach(function(id){
                var widget = cliche.getWidget(id);
                var listElt = that.displayUsedWidgetInList(widget.meta.name, widget.meta.id, userAppId);
                recursivelyLoadWidgetIntoList(widget, userAppId, listElt);
            });

        } else {
            // TODO
        }
    };

    that.displayUserWidgetInListAndSelect = function(name, id, clicheId){
        that.displayUnusedWidgetInList(name,id, clicheId);
        that.select(id);
    };

    /**
     * Adds a component to the list of user components
     * @param newComponent
     */
    that.displayUnusedWidgetInList = function(name, id, clicheId){
        // TODO changes in style
        var newWidgetElt = $(
            '<li data-type="'+'user'+'" class="widget draggable" data-componentid="' + id + '" data-clicheid=' + clicheId + '>'
            + '<div class="component-name-container">'
            + '<span class="component-name">' + name + '</span>'
            + '<span class="submit-rename not-displayed">'
            + '<input type="text" class="new-name-input form-control" autofocus>'
            + '</span>'
            + '</div>'
            + '<ul class="inner-widgets"></ul>'
            + '</li>');
        $('#user-components-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id, newWidgetElt);
        // registerUserWidgetAsDraggableForMainPages(id);
        dragAndDrop.registerWidgetDragHandleDraggable(newWidgetElt);
    };

    that.displayUsedWidgetInList = function(name, id, clicheId){
        // TODO changes in style
        var newWidgetElt = $(
            '<li data-type="'+'user'+'" class="widget not-draggable" data-componentid="' + id + '" data-clicheid=' + clicheId + '>'
            + '<div class="component-name-container">'
            + '<span class="component-name">' + name + '</span>'
            + '<span class="submit-rename not-displayed">'
            + '<input type="text" class="new-name-input form-control" autofocus>'
            + '</span>'
            + '</div>'
            + '<ul class="inner-widgets"></ul>'
            + '</li>');
        $('#user-used-components-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id, newWidgetElt);
        return newWidgetElt;
    };


    /**
     * Adds a component to the list of main pages
     * @param newComponent
     */
    that.displayNewWidgetInMainPagesList = function(name, id, clicheId){
        // TODO changes in style
        var newWidgetElt = $(
            '<li data-componentid="' + id + '" data-clicheid=' + clicheId + '>'
            + '<div class="component-name-container">'
            + '<div class="component-name">' + name + '</div>'
            + '<div class="submit-rename not-displayed">'
            + '<input type="text" class="new-name-input form-control" autofocus>'
            + '</div>'
            + '</div>'
            + '<div class="index-page-toggle">'
            + '</div>'
            + '<ul class="inner-widgets"></ul>'
            + '</li>');
        $('#main-pages-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id, newWidgetElt);
        return newWidgetElt;
    };

    that.displayMainPageInListAndSelect = function(name, id, clicheId){
        var listElt = that.displayNewWidgetInMainPagesList(name,id, clicheId);
        that.select(id);
        return listElt;
    };

    that.displayNewWidgetTemplateInList = function(name, id, clicheId){
        // TODO changes in style
        var newWidgetElt = $(
            '<li data-type="'+'user'+'" class="widget draggable" data-componentid="' + id + '" data-clicheid=' + clicheId + '>'
            + '<div class="component-name-container">'
            + '<div class="component-name">' + name + '</div>'
            + '<div class="submit-rename not-displayed">'
            + '<input type="text" class="new-name-input form-control" autofocus>'
            + '</div>'
            + '</div>'
            + '<ul class="inner-widgets"></ul>'
            + '</li>');
        $('#widget-templates-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id, newWidgetElt);
        dragAndDrop.registerWidgetDragHandleDraggable(newWidgetElt);
    };

    that.displayNewWidgetTemplateInListAndSelect = function(name, id, clicheId){
        var listElt = that.displayNewWidgetTemplateInList(name,id, clicheId);
        that.select(id);
        return listElt;
    };

    that.select = function(id){
        $('.selected').removeClass("selected");
        $("[data-componentid='" + id + "']").addClass('selected');
    };






    Object.freeze(that);
    return that;
};