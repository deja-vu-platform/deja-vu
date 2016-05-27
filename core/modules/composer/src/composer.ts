/// <reference path="../typings/tsd.d.ts" />
// const rp = require("request-promise");

export interface Type {
  name: string;
  element: string;
  loc: string;
//  fields: Field[];
}

export interface Field {
  name: string;
  "type": Type;
}

export interface TypeBond {
  types: Type[];
  subtype: Type;
}

export interface FieldBond {
  fields: Field[];
  subfield: Field;
}

export interface CompInfo {
  tbonds: TypeBond[];
  fbonds: FieldBond[];
}


export class Atom {
  atom_id: string;
  private _forwards;
  private _reverse;

  constructor(
      private _element: string, private _loc: string,
      private _comp_info?: CompInfo) {
    this.atom_id = "unsaved";
    this._forwards = {};
    this._reverse = {};
  }

  adapt(to: Type | string) {
    let type_info;
    if (typeof to === "string") {
      type_info = {name: to, element: this._element, loc: this._loc};
    } else {
      type_info = to;
    }
    // const name_map = this._get_name_map(to, type_info);
    const tinfo_str = JSON.stringify(type_info);
    this._forwards[tinfo_str] = this._forward_map(type_info);
    console.dir(this._forwards);
    return new Proxy(this, {
      get: (target, name) => {
             console.log("getting " + JSON.stringify(name));
             // return target[name_map[name]];
             if (name === "report_save") {
               console.log("it's a report save!");
               return target._report_save(type_info);
             } else if (name === "report_update") {
               console.log("it's a report update!");
               return target._report_update(type_info);
             }
             const core_name = target._forwards[tinfo_str][name];
             if (core_name !== undefined) {
               console.log("using core name " + core_name);
               name = core_name;
             }
             return target[name];
           },
      set: (target, name, value) => {
             console.log(
               "setting " + JSON.stringify(name) + " w " +
               JSON.stringify(value));

             const core_name = target._forwards[tinfo_str][name];
             if (core_name !== undefined) {
               name = core_name;
             } else { // the field we are putting is not bonded
               if (typeof name === "string" && !name.startsWith("_") &&
                   typeof value !== "function") {
                 this._reverse[name] = tinfo_str;
               }
             }
             target[name] = value;
             return true;
           }
    });
  }

  _report_save(t: Type) {
    return (atom_id: string) => {
      console.log(
          "Reporting save (id " + atom_id + ", t " + t.name + ") ");
      console.dir(this);

      for (const field_name of Object.keys(this._reverse)) {
        console.log("Looking at " + field_name);
        const field = this[field_name];
        const owner = this._reverse[field_name];
        if (field instanceof Array) {
          console.log("it's an array that corresponds to " + owner);
          console.dir(field);
        } else if (field instanceof Object) {
          console.log("it's an object that corresponds to " + owner);
          console.dir(field);
          // save and then report_save on this atom
          // when that returns do up of current
        } else {
          console.log(
              "it's a basic " + field + " that corresponds to " + owner);
        }
      }
    };
  }

  _report_update(t: Type) {
    return (update: any) => {
      console.log(
          "Reporting up (id " + this.atom_id + ") " +
          JSON.stringify(update));
    };
  }

  // from a type to the core
  _forward_map(t: Type) {
    if (this._comp_info === undefined) return {};
    const forward_map = {};
    // find the field bonds where t is part of, map field to core
    for (const fbond of this._comp_info.fbonds) {
      for (const field of fbond.fields) {
        if (this._t_equals(field.type, t)) {
          forward_map[field.name] = fbond.subfield.name;
        }
      }
    }
    console.log("ret forward map is " + JSON.stringify(forward_map));
    return forward_map;
  }

  _t_equals(t1: Type, t2: Type) {
    return (
      t1.name === t2.name && t1.element === t2.element && t1.loc === t2.loc);
  }
}

export class Composer {
  constructor(
      private _element: string, private _loc: string,
      private _comp_info?: CompInfo) {}

  new_atom() {
    return new Atom(this._element, this._loc, this._comp_info);
  }

  report_save(atom_id: string, atom: any) {
    atom.report_save(atom_id);
  }

  report_update(update: any, atom: any) {
    atom.report_update(update);
  }

//  private _get_name_map(src: Type, dst: Type) {
//    return {};
//  }
/*
  private _new_atom(t: any, atom_id: string, atom: any) {
    console.log("sending new atom to composer");
    const atom_str = JSON.stringify(
        this._filter_atom(t, atom)).replace(/"/g, "\\\"");
    console.log("t is " + t.name);
    console.log("atom id is " + atom_id);
    this._post(`{
      newAtom(
        type: {
          name: "${t.name}", element: "${this._element}", loc: "${this._loc}"
        },
        atom_id: "${atom_id}",
        atom: "${atom_str}")
    }`);
  }

  // no filtering update
  private _update_atom(t: any, atom_id: string, update: any) {
    console.log("sending up atom to composer");
    const update_str = JSON.stringify(update).replace(/"/g, "\\\"");
    this._post(`{
      updateAtom(
        type: {
          name: "${t.name}", element: "${this._element}", loc: "${this._loc}"
        },
        atom_id: "${atom_id}",
        update: "${update_str}")
    }`);
  }

  private _rm_atom(t: any, id: string) {
    console.log("sending rm atom to composer");
    this._post(`rm`);
  }

  private _filter_atom(t: any, atom: any) {
    let filtered_atom = {};
    for (const f of Object.keys(t._fields)) {
      const atom_f = atom[f];

      let filtered_atom_f = {};
      if (Array.isArray(atom_f)) {   // list type
        filtered_atom_f = this._filter_list(atom_f);
      } else if (typeof atom_f === "object") {  // object type
        filtered_atom_f["atom_id"] = atom_f["atom_id"];
      } else {  // scalar type
        filtered_atom_f = atom_f;
      }

      filtered_atom[f] = filtered_atom_f;
    }
    console.log(
        "BEFORE FILTER <" + JSON.stringify(atom) + "> AFTER FILTER <" +
        JSON.stringify(filtered_atom) + ">");
    return filtered_atom;
  }

  private _filter_list(l: Array<any>) {
    return l.map(atom => {
      let filtered_atom = {};
      if (typeof atom === "object") {
        filtered_atom["atom_id"] = atom["atom_id"];
      } else if (atom["Symbol.iterator"] === "function") {
        filtered_atom = this._filter_list(atom);
      } else {
        filtered_atom = atom;
      }
      return filtered_atom;
    });
  }

  private _post(query) {
    const query_str = query.replace(/ /g, "");

    const options = {
      uri: loc + "/graphql",
      method: "post",
      body: {
        query: "mutation " + query_str
      },
      json: true
    };

    console.log(
      "using options " + JSON.stringify(options) +
      " for query <" + query_str + ">");
    return rp(options)
      .then(body => {
        console.log(body);
        return body;
      });
  }
  */
}
