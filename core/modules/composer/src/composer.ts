/// <reference path="../typings/tsd.d.ts" />
import {Injectable, Inject} from "angular2/core";
import {Http, Headers} from "angular2/http";
// import * as _ from "underscore";
import {Observable} from "rxjs/rx";
import "rxjs/add/operator/toPromise";


function uuid() {  // from SO
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(/[xy]/g, c => {
      var r = Math.random()*16|0, v = c === "x" ? r : (r&0x3|0x8);
      return v.toString(16);
    });
}

export interface Type {
  name: string;
  element: string;
  loc: string;
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
  private _core: Atom;

  constructor(private _helper, private _comp_info?: CompInfo) {
    this.atom_id = "unsaved";
    this._forwards = {};
    this._reverse = {};
    this._core = this;
  }

  adapt(t: Type) {
    const tinfo_str = JSON.stringify(t);
    console.log("Adapting to " + tinfo_str);
    this._forwards[tinfo_str] = this._forward_map(t);
    console.dir(this._forwards);
    return new Proxy(this._core, {
      get: (target, name) => {
             // console.log("getting " + JSON.stringify(name));
             if (name === "report_save") {
               return target._report_save(t);
             } else if (name === "report_update") {
               return target._report_update(t);
             }
             const core_name = target._forwards[tinfo_str][name];
             if (core_name !== undefined) {
               name = core_name;
             }
             return target[name];
           },
      set: (target, name, value) => {
             const core_name = target._forwards[tinfo_str][name];
             console.log(
               "setting " + JSON.stringify(name) + " core name " + core_name);
             console.log("beging val");
             console.dir(value);
             console.log("end val");

             if (core_name !== undefined) {
               name = core_name;
             }

             target._reverse[name] = tinfo_str;
             target[name] = value;
             return true;
           }
    });
  }

  _report_save(t: Type) {
    return (atom_id: string) => {
      console.log(
          "Reporting save (id " + atom_id + ", t " + t.name + ") ");

      const ps = [];
      for (let field of Object.keys(this._reverse)) {
        // For each field that was not saved by the reporting type
        // we compute the update op to include unsaved fields

        const value = this[field];
        const owner = this._reverse[field];
        if (this._t_equals(JSON.parse(owner), t)) {
          continue;
        }

        console.log("Looking at " + field + " owned by " + owner);

        // Remap up so that it makes sense to owner
        for (const src_field of Object.keys(this._forwards[owner])) {
          const dst_field = this._forwards[owner][src_field];
          if (dst_field === field) {
            field = src_field;
          }
        }
        ps.push(this._get_up(field, value).then(up => {
          console.log("got up");
          console.dir(up);
          console.log("got up end");
          const ret = {};
          ret[owner] = up;
          return ret;
        }));
      }

      return Promise.all(ps)
          .then(values => {
             const ups = {};
             console.log("begin values");
             console.dir(values);
             console.log("end values");
             for (const value of values) {
               const owner = Object.keys(value)[0];
               const up = value[owner];
               if (ups[owner] === undefined) ups[owner] = {};
               ups[owner] = Object.assign(ups[owner], up);
             }
             return ups;
          })
          .then(ups => {
            console.log("got ups");
            console.dir(ups);

            const ps = [];
            for (const owner of Object.keys(ups)) {
              ps.push(
                  this._helper
                      .update_atom(
                        JSON.parse(owner), atom_id, {$set: ups[owner]}));
            }
            return Promise.all(ps);
          });
    };
  }

  _save(atom_id: string) {
    // pick some t to make the save
    const t = JSON.parse(Object.keys(this._forwards)[0]);
    console.log("picked t " + JSON.stringify(t) + " to do the save");
    return this._helper.new_atom(t, atom_id, this);
  }

  _get_up(field: string, value: any): Promise<any> {
    let ret;
    if (value instanceof Array) {
      console.log("it's an array");
      return Promise
        .all(value.map((arr_val, i) => this._get_up(field + "." + i, arr_val)))
        .then(pvalues => {
          console.log("pval begin");
          console.dir(pvalues);
          console.log("pval end");
          return pvalues
            .reduce((acc, pval) => Object.assign(acc, pval), {});
        });
    } else if (value instanceof Atom) {
      console.log("it's an atom");
      if (value.atom_id === "unsaved") {
        const atom_id = uuid();
        ret = value._save(atom_id).then(_ => {
          console.log("returned from saving " + atom_id);
          const up = {};
          up[field] = atom_id;
          return up;
        });
      } else {
        const up = {};
        up[field] = value.atom_id;
        ret = Promise.resolve(up);
      }
    } else if (value instanceof Object) {
      // can't have objects that are not atoms
      console.log("ERROR: it's an object");
    } else {
      console.log("it's a basic value: " + value);
      const up = {};
      up[field] = value;
      ret = Promise.resolve(up);
    }
    return ret;
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
          // use the subfield name
          forward_map[field.name] = fbond.subfield.name;
        }
      }
    }
    console.log("ret forward map is " + JSON.stringify(forward_map));
    return forward_map;
  }

  _t_equals(t1: Type, t2: Type) {
    return (
      t1.name.toLowerCase() === t2.name.toLowerCase() &&
      t1.element.toLowerCase() === t2.element.toLowerCase() &&
      t1.loc === t2.loc);
  }
}


@Injectable()
export class Composer {
  constructor(
      @Inject("element") private _element: string,
      @Inject("loc") private _loc: string, private _http: Http,
      @Inject("CompInfo") private _comp_info: CompInfo) {}

  new_atom(t: string): any {
    return new Atom(new Helper(this._http), this._comp_info)
      .adapt({name: t, element: this._element, loc: this._loc});
  }

  report_save(atom_id: string, atom: any) {
    if (!(atom instanceof Atom)) {
      console.log("ERROR: reporting save on something that's not an atom");
      console.dir(atom);
      return Promise.reject(
          new Error("reporting save on something that's not an atom"));
    }
    return atom.report_save(atom_id);
  }

  report_update(update: any, atom: any) {
    if (!(atom instanceof Atom)) {
      console.log("ERROR: reporting update on something that's not an atom");
      console.dir(atom);
      return Promise.reject(
          new Error("reporting update on something that's not an atom"));
    }
    return atom.report_update(update);
  }
}


class Helper {
  constructor(private _http) {}

  new_atom(t: Type, atom_id: string, atom: Atom): Promise<any> {
    return this._filter_atom(t, atom)
      .map(filtered_atom => {
        console.log("sending new atom to element");
        const atom_str = JSON.stringify(filtered_atom).replace(/"/g, "\\\"");
        console.log("t is " + t.name);
        console.log("atom id is " + atom_id);
        return this._post("http://localhost:3001", `{
           newAtom(
             type: {
               name: "${t.name}", element: "${t.element}", loc: "${t.loc}"
             },
             atom_id: "${atom_id}",
             atom: "${atom_str}",
             self_forward: true)
         }`).toPromise();
      })
      .toPromise();
  }

  // no filtering update
  update_atom(t: Type, atom_id: string, update: any) {
    console.log("sending up atom to composer");
    const update_str = JSON.stringify(update).replace(/"/g, "\\\"");
    return this._post("http://localhost:3001", `{
      updateAtom(
        type: {
          name: "${t.name}", element: "${t.element}", loc: "${t.loc}"
        },
        atom_id: "${atom_id}",
        update: "${update_str}",
        self_forward: true)
    }`)
    .toPromise();
  }

  private _schema_query(t: Type) {
    return `{
       __type(name: "${t.name}") {
         name,
         fields {
           name,
           type {
             name,
             kind,
             ofType {
               name,
               kind
             }
           }
         }
       }
     }`;
  }

  private _info(t: Type) {
    return this._get(t.loc, this._schema_query(t))
      .map(data => data.__type)
      .map(tinfo => tinfo.fields);
  }

  private _filter_atom(t: Type, atom: Atom) {
    let filtered_atom = {};
    return this._info(t)
      .map(fields => fields.map(f => f.name))
      .map(fields => {
        for (const f of fields) {
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
        console.log("BEFORE FILTER ");
        console.dir(atom);
        console.log("AFTER FILTER <" + JSON.stringify(filtered_atom) + ">");
        return filtered_atom;
      });
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

  private _get(loc, query): Observable<any> {
    const query_str = encodeURIComponent(
      query.replace(/ /g, "").replace(/\n/g, ""));

    const options = {
      uri: loc + `/graphql?query=query+${query_str}`
    };

    console.log(
      "using options " + JSON.stringify(options) +
      " for query <" + query_str + ">");
    return this._http.get(options.uri)
      .map(res => res.json())
      .map(json => json.data);
  }

  private _post(loc, query): Observable<any> {
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
    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    return this._http
      .post(
          options.uri,
          JSON.stringify({query: "mutation " + query_str}),
          {headers: headers})
      .map(res => res.json());
  }
}
