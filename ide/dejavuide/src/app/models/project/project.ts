import { generateId } from '../../utility/utility';
import { Cliche, UserCliche, DvCliche} from '../cliche/cliche';

/**
 * A map from clicheIds to all cliches
 */
type ClicheMap = Map<string, Cliche>;

export interface Meta {
  name: string;
  id: string;
  version?: string;
  author?: string;
  templateId?: string;
  clicheId?: string;
  parentId?: string;
}

export class Project {
  objectType = 'Project';
  meta: Meta;
  userApp: UserCliche = null;
  importedCliches = new Map<string, DvCliche>();
  lastAccessed = -Infinity;

  static fromObject (object: any): Project {
    const notCorrectObject = 'Object is not an instance of a Project';
    if (object.objectType !== 'Project') {
      throw Error(notCorrectObject);
    }
    const project = new Project(object.meta.name, object.meta.id, true);
    project.userApp = UserCliche.fromJSON(object.userApp, project);

    for (const clicheId of Object.keys(object.importedCliches)) {
        project.importCliche(clicheId);
    }
    return project;
  }

  constructor (name, id?: string, fromObject = false) {
    this.meta = {
      name: name,
      id: id || generateId(),
      version: '',
      author: ''
    };

    this.lastAccessed = (new Date()).getTime();
    if (!fromObject) {
      this.userApp = new UserCliche({name: this.meta.name}, this);
    }
  }

  getName(): string {
    return this.meta.name;
  }

  importCliche (clicheId) {
    // TODO figure out how importing works
    this.importedCliches.set(clicheId, null);
  }

  removeImportedCliche (clicheId) {
      this.importedCliches.delete(clicheId);
  }

  getUserApp () {
    return this.userApp;
  }

  updateAccess() {
    this.lastAccessed = (new Date()).getTime();
  }

  getLastAccessed() {
    return this.lastAccessed;
  }

  getSaveableJson() {
    const json: Project = Object.assign({}, this);
    // TODO fix this
    json.userApp = (Cliche.toJSON(this.userApp) as UserCliche);
    json.importedCliches.forEach((cliche, clicheId) => {
      // TODO
      // make sure to create a copy and not overwrite anything in this
    });
    return JSON.parse(JSON.stringify(json));
  }
}
