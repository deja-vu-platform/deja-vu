/**
 * Created by Shinjini on 2/21/2017.
 */

const DEFAULT_COMPONENT_NAME = "New Component";

var Cliche = function(name, id, version, author){
    var that = Object.create(Cliche.prototype);

    that.objectType = "Cliche";
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
        pages: {
            // widgetId: UserWidgetInstance
        },
        unused:{

        },
        templates:{

        }
    };

    that.datatypes = {
        // datatypeId: UserDataInstance

    };


    return that;
};




Cliche.prototype.inMainPage = function(widgetId){
    var widget = this.widgets[widgetId];
    return widget.inMainPages;
};


Cliche.prototype.addMainPage = function(widget){
    widget.inMainPages = true;
    this.mainPages[widget.meta.id] = widget.meta.name;
    this.addWidget(widget);
};

Cliche.prototype.removeMainPage = function(widget){
    delete this.mainPages[widget.meta.id];
    widget.inMainPages = false;
};

Cliche.prototype.addWidget = function(widget){
    if (!this.widgets[widget.meta.id]) {
        this.widgets[widget.meta.id] = widget;
    }
};

Cliche.prototype.removeWidget = function(widgetId){
    delete this.widgets[widgetId];
    delete this.mainPages[widgetId];
};

Cliche.prototype.addDatatype = function(datatype, displayProps){
    if (!this.datatypes[datatype.meta.id]) {
        this.datatypes[datatype.meta.id] = datatype;
        this.datatypeDisplays[datatype.meta.id] = displayProps;
    }
};

Cliche.prototype.removeDatatype = function(datatypeId){
    delete this.datatypes[datatypeId];
};


Cliche.fromString = function(string){
    var object = JSON.parse(string);
    return Cliche.fromObject(object)
};


Cliche.prototype.getNumWidgets = function(){
    return Object.keys(this.widgets).length;
};


Cliche.fromObject = function(object){
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

    var component = $.extend(new Cliche(), object);

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


var UserApp = function(){
    var that = Object.create(Cliche.prototype);

    that.datatypeDisplays = {
        overview: UserDatatypeDisplay(),
        particulars: {
            // datatypeId : DatatypeDisplay object
        }
    };

    that.widgetBondDisplays = {
        overview: {}, //UserWidgetBondDisplay(),
        particulars: {
            // datatypeId : DatatypeDisplay object
        }
    };

    that.properties = {
    };

    return that;
};
