import { generateId, shallowCopy } from '../utility/utility';
import { Cliche, UserCliche, DvCliche} from '../cliche/cliche';

interface ProjectFields {
  id?: string;

  name?: string;
  author?: string;
  version?: string;

  userAppFields?: any;
  lastAccessed?: number;
}

export class Project {
  fields: ProjectFields;
  userApp: UserCliche = null;
  importedCliches = new Map<string, DvCliche>();

  static getName(fields: ProjectFields): string {
    return fields.name;
  }

  static getId(fields: ProjectFields): string {
    return fields.id;
  }

  static fromJSON (fields: ProjectFields): Project {
    const project = new Project(fields);
    project.userApp = UserCliche.fromJSON(fields.userAppFields);

    // TODO
    // for (const clicheId of Object.keys(fields.importedCliches)) {
    //     project.importCliche(clicheId);
    // }
    return project;
  }

  static toJSON (project: Project) {
    const json = Project.copyFields(project.fields);
    json.userAppFields = Cliche.toJSON(project.userApp);
    // json.importedCliches.forEach((cliche, clicheId) => {
    //   // TODO
    //   // make sure to create a copy and not overwrite anything in this
    // });
    return json;
  }

  static copyFields(fields: ProjectFields): ProjectFields {
    const copyfields = shallowCopy(fields);
    return copyfields;
  }


  constructor (fields: ProjectFields) {
    this.fields = Project.copyFields(fields);
    // asign default values;
    this.fields.id = fields.id ? this.fields.id : generateId();

    this.fields.name = fields.name || 'New Project';
    this.fields.version = fields.version || '0.0.0';
    this.fields.author = fields.author || 'anonymous';

    this.fields.lastAccessed = (new Date()).getTime();
    if (this.fields.userAppFields) {
      this.userApp = new UserCliche(this.fields.userAppFields);
    } else {
      this.userApp = new UserCliche({name: this.fields.name});
    }
  }

  getId(): string {
    return this.fields.id;
  }

  getName(): string {
    return this.fields.name;
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
    this.fields.lastAccessed = (new Date()).getTime();
  }

  getLastAccessed() {
    return this.fields.lastAccessed;
  }
}
