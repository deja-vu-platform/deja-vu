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

    // ClicheWithDisplay has all types of widgets
    // Other cliches only use templates

    // TODO
    // separate widgets and pages:
    // ClicheWithDisplay (A user app) will have pages a normal cliche will only have widgets
    // templates will be moved to a completely separate datatype
    that.widgets = {
        pages: {
            // widgetId: UserWidgetInstance
        },
        unused:{

        },
        templates:{

        }
    };

    // ClicheWithDisplay uses *only* used and unused
    that.datatypes = {
        // datatypeId: UserDataInstance
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
    for (var datatypeId in object.datatypes) {
        var datatype = object.datatypes[datatypeId];
        cliche.datatypes[datatypeId] = UserDatatype.fromObject(datatype);
    }
    return cliche
};


var ClicheWithDisplay = function(name, id, version, author){
    var cliche = Cliche(name, id, version, author);
    var that = Object.create(ClicheWithDisplay.prototype);
    that = $.extend(that, cliche); // TODO sketchy

    that.objectType = "ClicheWithDisplay";

    that.dataBondDisplays = {
        // datatypeId : DatatypeDisplay object
    };
    that.dataBondDisplays[id] = UserDatatypeDisplay();

    that.widgetBondDisplays = {
        cliche: null, //UserWidgetBondDisplay(),
        widgets: {
            // don't care about pages b/c they don't have behavior by themselves
            // widgetId : WidgetDisplay object

        }
    };

    that.properties = {
    };

    return that;
};

ClicheWithDisplay.fromString = function(string){
    var object = JSON.parse(string);
    return ClicheWithDisplay.fromObject(object)
};

ClicheWithDisplay.fromObject = function(object){
    var app = Cliche.fromObject(object);
    app = $.extend(new ClicheWithDisplay(), app);

    return app
};



ClicheWithDisplay.prototype.isPage = function(widgetId){
    return widgetId in this.widgets.pages;
};


ClicheWithDisplay.prototype.addPage = function(widget){
    widget.isPage = true;
    this.widgets.pages[widget.meta.id] = widget;
};

ClicheWithDisplay.prototype.deletePage = function(widget){
    delete this.widgets.pages[widget.meta.id];
    widget.isPage = false; // it will no longer be usable but still...
};

ClicheWithDisplay.prototype.addTemplate = function(widget){
    widget.isTemplate = true;
    this.widgets.templates[widget.meta.id] = widget;
};

ClicheWithDisplay.prototype.deletePage = function(widget){
    delete this.widgets.templates[widget.meta.id];
    widget.isTemplate = false; // it will no longer be usable but still...
};


/**
 * makes a new unused widget
 * @param widget
 */
ClicheWithDisplay.prototype.addWidget = function(widget){
    if (!(this.widgets.pages[widget.meta.id] || this.widgets.unused[widget.meta.id])) {
        this.widgets.unused[widget.meta.id] = widget;
    }
};

ClicheWithDisplay.prototype.deleteWidget = function(widgetId){
    delete this.widgets.pages[widgetId];
    delete this.widgets.unused[widgetId];
    delete this.widgets.templates[widgetId];
};

ClicheWithDisplay.prototype.addDatatype = function(datatype, displayProps){
    if (!(this.datatypes[datatype.meta.id])) {
        this.datatypes[datatype.meta.id] = datatype;
        this.dataBondDisplays[datatype.meta.id] = displayProps;
    }
};



ClicheWithDisplay.prototype.deleteDatatype = function(datatypeId){
    delete this.datatypes[datatypeId];
    delete this.dataBondDisplays[datatypeId];
};


ClicheWithDisplay.prototype.getNumWidgets = function(){
    return Object.keys(this.widgets.pages).length +  Object.keys(this.widgets.unused).length + Object.keys(this.widgets.templates).length;
};

ClicheWithDisplay.prototype.getAllDatatypeIds = function(){
    return Object.keys(this.datatypes);

};

ClicheWithDisplay.prototype.getAllWidgetIds = function(){
    var used = Object.keys(this.widgets.pages);
    var unused = Object.keys(this.widgets.unused);
    var templates = Object.keys(this.widgets.templates);
    return used.concat(unused).concat(templates)
};

ClicheWithDisplay.prototype.getWidget = function(widgetId){
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