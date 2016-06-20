/** ** ** ** Constants ** ** ** **/
var DEFAULT_PROJECT_NAME = "New Project";
var DEFAULT_AUTHOR = "Unknown";
var DEFAULT_VERSION = '0.0.1';
/** ** ** ** ** ** ** ** ** ** **/


/**
 * Project
 * @returns {Project}
 * @constructor
 */
function Project() {
    //this.type = '';
    this.meta = {};
    this.numComponents = 0;
    this.components = {};
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
    //this.type = type;
    this.meta = {
        name: name,
        id: id,
        version: version,
        author: author
    };
    this.numComponents = 0;
    this.components = {};
}

UserProject.prototype.addComponent = function(componentId, component){
    this.numComponents++;
    this.components[componentId] = component;
};


UserProject.prototype.removeComponent = function(componentId){
    this.numComponents--;
    delete this.components[componentId];
};


//selectedUserProject = new UserProject(DEFAULT_PROJECT_NAME, 1, DEFAULT_VERSION, DEFAULT_AUTHOR);
//selectedUserComponent.addComponent({}, 2, 3);