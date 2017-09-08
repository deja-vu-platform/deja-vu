/** ** ** ** Constants ** ** ** **/
const DEFAULT_PROJECT_NAME = "New Project";
const DEFAULT_AUTHOR = "Unknown";
const DEFAULT_VERSION = '0.0.1';
/** ** ** ** ** ** ** ** ** ** **/

// Useful tip from: http://stackoverflow.com/questions/7694501/class-static-method-in-javascript
//
// Think of f = new Foo(); as creating a class instance,
// Foo.prototype.bar = function(){...} as defining a shared method for the class, and
// Foo.baz = function(){...} as defining a public static method for the class.
//



/**
 * Project
 * @returns {Project}
 * @constructor
 */
function Project() {
    this.objectType = "Project";
    //this.type = '';
    this.meta = {};
    this.userApp = null;
    this.cliches = {};
    this.lastAccessed = -Infinity;
    this.addedCliches = {};
}

/**
 *
 * @param dimensions
 * @param name
 * @param id
 * @param version
 * @param author
 * @constructor
 */
UserProject.prototype = new Project();
UserProject.prototype.constructor = UserProject;
function UserProject(name, id, version, author) {
    this.objectType = "UserProject";
    //this.type = type;
    this.meta = {
        name: name,
        id: id,
        version: version,
        author: author
    };
    this.userApp = null; // one component for now
    this.cliches = {};
    this.bondDisplays = { // overall display
        // clicheId: {
        //      dataBondDisplays:{
        //          id: displayObj
        //      },
        //      widgetBondDisplays:{
        //          id: displayObj
        //      }
        // }

    };

    this.lastAccessed = new Date();

}

UserProject.prototype.addCliche = function(cliche){
    if (!this.cliches[cliche.meta.id]) {
        this.cliches[cliche.meta.id] = cliche;
        this.bondDisplays[cliche.meta.id] = {};
        this.bondDisplays[cliche.meta.id].dataBondDisplays = {};
        this.bondDisplays[cliche.meta.id].dataBondDisplays[cliche.meta.id] = UserDatatypeDisplay();
        this.bondDisplays[cliche.meta.id].widgetBondDisplays = {};
        this.bondDisplays[cliche.meta.id].widgetBondDisplays[cliche.meta.id] = UserDatatypeDisplay(); //TODO fixme
    }

};

UserProject.prototype.addDataBondDisplay = function(clicheId, datatypeId, displayObject){
    if (!displayObject){
        displayObject = UserDatatypeDisplay();
    }
    this.bondDisplays[clicheId].dataBondDisplays[datatypeId] = displayObject;
};

UserProject.prototype.removeCliche = function(clicheId){
    if (!(clicheId == this.userApp)){ // FIXME
        delete this.cliches[clicheId];
    }
    // if (clicheId == this.userApp){ // FIXME
    //     this.userApp = null;
    // }
};


// TODO Ummm this should be fixed
UserProject.prototype.makeUserApp = function(component){
    if (component.meta.id in this.cliches){
        this.userApp = component.meta.id;
    }
};

UserProject.prototype.removeMainComponent = function(){
    selectedProject.userApp = null;

};

UserProject.prototype.getNumCliches = function(){
    return Object.keys(this.cliches).length;
};

UserProject.fromString = function(string){
    var object = JSON.parse(string);
    return UserProject.fromObject(object);
};

UserProject.fromObject = function(object){
    // Check that the object has all the required fields
    var notCorrectObjectError = "notCorrectObjectError: object object is not an instance of a UserProject";
    if (!object.objectType){
        throw notCorrectObjectError;
    }
    // if (!object.userApp){
    //     throw notCorrectObjectError;
    // }
    if (!object.meta){
        throw notCorrectObjectError;
    }
    if (!object.cliches){
        throw notCorrectObjectError;
    }

    var project = $.extend(new UserProject(), object);

    for (var clicheId in object.cliches) {
        var cliche = object.cliches[clicheId];
        project.cliches[clicheId] = ClicheWithDisplay.fromObject(cliche);
    }
    return project
};

UserProject.prototype.getAllCliches = function(){
    var cliches = [];
    var project = this;
    for (var clicheId in project.cliches){
        cliches.push(project.cliches[clicheId])
    }
    return cliches
};