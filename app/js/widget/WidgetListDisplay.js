/**
 * Created by Shinjini on 3/27/2017.
 */

var WidgetListDisplay = function(){
    var that = Object.create(WidgetListDisplay.prototype);

    that.displayUserWidgetInListAndSelect = function(name, id, clicheId){
        $('.selected').removeClass("selected");
        that.displayNewWidgetInUserWidgetList(name,id, clicheId);
        $("#user-components-list").find("[data-componentid='" + id + "']").addClass('selected').draggable('disable');
    };

    /**
     * Adds a component to the list of user components
     * @param newComponent
     */
    that.displayNewWidgetInUserWidgetList = function(name, id, clicheId){
        // TODO changes in style
        var newWidgetElt = $(
            '<li data-type="'+'user'+'" class="widget draggable" data-componentid="' + id + '" data-clicheid=' + clicheId + '>'
            + '<div class="component-name-container">'
            + '<span class="component-name">' + name + '</span>'
            + '<span class="submit-rename not-displayed">'
            + '<input type="text" class="new-name-input form-control" autofocus>'
            + '</span>'
            + '</div>'
            + '</li>');
        $('#user-components-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id);
        // registerUserWidgetAsDraggableForMainPages(id);
        dragAndDrop.registerWidgetDragHandleDraggable(newWidgetElt);
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
            + '</li>');
        $('#main-pages-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id);
        // registerUserWidgetAsDraggableForMainPages(id);
    };

    that.displayMainPageInListAndSelect = function(name, id, clicheId){
        $('.selected').removeClass("selected");
        that.displayNewWidgetInMainPagesList(name,id, clicheId);
        $("#main-pages-list").find("[data-componentid='" + id + "']").addClass('selected');
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
            + '</li>');
        $('#widget-templates-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id);
        dragAndDrop.registerWidgetDragHandleDraggable(newWidgetElt);
    };

    that.displayNewWidgetTemplateInListAndSelect = function(name, id, clicheId){
        $('.selected').removeClass("selected");
        that.displayNewWidgetTemplateInList(name,id, clicheId);
        $('#widget-templates-list').find("[data-componentid='" + id + "']").addClass('selected');
    }







    Object.freeze(that);
    return that;
};