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

    // UserApp has all types of widgets
    // Other cliches only use templates
    that.widgets = {
        pages: {
            // widgetId: UserWidgetInstance
        },
        unused:{

        },
        templates:{

        }
    };

    // UserApp uses *only* used and unused
    // Here templates are *only* used by Cliches
    that.datatypes = {
        used:{
            // datatypeId: UserDataInstance
        },
        unused:{

        },
        templates:{

        }
    };


    return that;
};



Cliche.fromString = function(string){
    var object = JSON.parse(string);
    return Cliche.fromObject(object)
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

    var cliche = $.extend(new Cliche(), object);

    for (var widgetType in object.widgets) {
        for (var widgetId in object.widgets[widgetType]) {
            var widget = object.widgets[widgetType][widgetId];
            cliche.widgets[widgetType][widgetId] = UserWidget.fromObject(widget);
        }
    }
    for (var datatypeType in object.datatypes) {
        for (var datatypeId in object.datatypes[datatypeType]) {
            var datatype = object.datatypes[datatypeType][datatypeId];
            cliche.datatypes[datatypeId] = UserDatatype.fromObject(datatype);
        }
    }
    return cliche
};


var UserApp = function(name, id, version, author){
    var cliche = Cliche(name, id, version, author);
    var that = Object.create(UserApp.prototype);
    that = $.extend(that, cliche); // TODO sketchy

    that.objectType = "UserApp";

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

UserApp.fromString = function(string){
    var object = JSON.parse(string);
    return UserApp.fromObject(object)
};

UserApp.fromObject = function(object){
    var app = Cliche.fromObject(object);
    app = $.extend(new UserApp(), app);

    return app
};



UserApp.prototype.isPage = function(widgetId){
    return widgetId in this.widgets.pages;
};


UserApp.prototype.addPage = function(widget){
    widget.isPage = true;
    this.widgets.pages[widget.meta.id] = widget;
};

UserApp.prototype.deletePage = function(widget){
    delete this.widgets.pages[widget.meta.id];
    widget.isPage = false; // it will no longer be usable but still...
};

UserApp.prototype.addTemplate = function(widget){
    widget.isTemplate = true;
    this.widgets.templates[widget.meta.id] = widget;
};

UserApp.prototype.deletePage = function(widget){
    delete this.widgets.templates[widget.meta.id];
    widget.isTemplate = false; // it will no longer be usable but still...
};


/**
 * makes a new unused widget
 * @param widget
 */
UserApp.prototype.addWidget = function(widget){
    if (!(this.widgets.pages[widget.meta.id] || this.widgets.unused[widget.meta.id])) {
        this.widgets.unused[widget.meta.id] = widget;
    }
};

UserApp.prototype.deleteWidget = function(widgetId){
    delete this.widgets.pages[widgetId];
    delete this.widgets.unused[widgetId];
    delete this.widgets.templates[widgetId];
};

UserApp.prototype.addDatatype = function(datatype, displayProps){
    if (!(this.datatypes.unused[datatype.meta.id])) {
        this.datatypes.unused[datatype.meta.id] = datatype;
        this.datatypeDisplays[datatype.meta.id] = displayProps;
    }
};

UserApp.prototype.removeDatatype = function(datatypeId){
    delete this.datatypes[datatypeId];
};


UserApp.prototype.getNumWidgets = function(){
    return Object.keys(this.widgets.pages).length +  Object.keys(this.widgets.unused).length + Object.keys(this.widgets.templates).length;
};

UserApp.prototype.getAllDatatypeIds = function(){
    var used = Object.keys(this.datatypes.used);
    var unused = Object.keys(this.datatypes.unused);
    return used.concat(unused)
};

UserApp.prototype.getAllWidgetIds = function(){
    var used = Object.keys(this.widgets.pages);
    var unused = Object.keys(this.widgets.unused);
    var templates = Object.keys(this.widgets.templates);
    return used.concat(unused).concat(templates)
};

UserApp.prototype.getWidget = function(widgetId){
    if (widgetId in this.widgets.pages){
        return this.widgets.pages[widgetId]
    }
    if (widgetId in this.widgets.unused){
        return this.widgets.unused[widgetId]
    }
    if (widgetId in this.widgets.templates){
        return this.widgets.templates[widgetId]
    }

    return null
}