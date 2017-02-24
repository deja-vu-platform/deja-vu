/**
 * Created by Shinjini on 2/21/2017.
 */

const DEFAULT_COMPONENT_NAME = "New Component";

var UserComponent = function(name, id, version, author){
    var that = Object.create(UserComponent.prototype);

    that.objectType = "UserComponent";
    that.type = "user";
    that.meta = {
        name: name,
        id: id,
        version: version,
        author: author
    };

    that.mainPages = {

    };

    that.widgets = {
        // widgetId: UserWidgetInstance
    };

    that.datatypes = {
        // datatypeId: UserDataInstance
    };

    that.properties = {
    };
    return that;
};




UserComponent.prototype.inMainPage = function(widgetId){
    var widget = this.widgets[widgetId];
    return widget.inMainPages;
};


UserComponent.prototype.addMainPage = function(widget){
    widget.inMainPages = true;
    this.mainPages[widget.meta.id] = widget.meta.name;
    this.addWidget(widget);
};

UserComponent.prototype.removeMainPage = function(widget){
    delete this.mainPages[widget.meta.id];
    widget.inMainPages = false;
};

UserComponent.prototype.addWidget = function(widget){
    if (!this.widgets[widget.meta.id]) {
        this.widgets[widget.meta.id] = widget;
    }
};

UserComponent.prototype.removeWidget = function(widgetId){
    delete this.widgets[widgetId];
    delete this.mainPages[widgetId];
};

UserComponent.prototype.addDatatype = function(datatype){
    if (!this.datatypes[datatype.meta.id]) {
        this.datatypes[datatype.meta.id] = datatype;
    }
};

UserComponent.prototype.removeDatatype = function(datatypeId){
    delete this.datatypes[datatypeId];
};


UserComponent.fromString = function(string){
    var object = JSON.parse(string);
    return UserComponent.fromObject(object)
};


UserComponent.prototype.getNumWidgets = function(){
    return Object.keys(this.widgets).length;
};


UserComponent.fromObject = function(object){
    // Check that the object has all the required fields
    var notCorrectObjectError = "notCorrectObjectError: object object is not an instance of a UserProject";
    if (!object.objectType){
        throw notCorrectObjectError;
    }
    if (!object.meta){
        throw notCorrectObjectError;
    }
    if (!object.widgets){
        throw notCorrectObjectError;
    }
    if (!object.datatypes){
        throw notCorrectObjectError;
    }
    if (!object.properties){
        throw notCorrectObjectError;
    }

    var component = $.extend(new UserComponent(), object);

    for (var widgetId in object.widgets) {
        var widget = object.widgets[widgetId];
        component.widgets[widgetId] = UserWidget.fromObject(widget);
    }
    for (var datatypeId in object.datatypes) {
        var datatype = object.datatypes[datatypeId];
        component.datatypes[datatypeId] = UserDatatype.fromObject(datatype);
    }
    return component
};

