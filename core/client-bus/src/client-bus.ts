/// <reference path="../typings/tsd.d.ts" />
import {Injectable, Inject} from "angular2/core";


export interface Type {
  name: string;
  fqelement: string;
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


export class PrimitiveAtom {
  private _on_change_listeners: (() => void)[] = [];

  constructor() {
    return new Proxy(this, {
      set: (target, name, value) => {
             target[name] = value;

             for (const on_change of this._on_change_listeners) {
               on_change();
             }
             return true;
           }
    });
  }

  on_change(handler: () => void) {
    this._on_change_listeners.push(handler);
  }
}

export class Atom {
  private _forwards;
  private _core: Atom;
  private _on_change_listeners: (() => void)[] = [];

  constructor(private _comp_info: CompInfo) {
    this._forwards = {};
    this._core = this;
  }

  adapt(t: Type) {
    const tinfo_str = JSON.stringify(t);
    console.log("Adapting to " + tinfo_str);
    this._forwards[tinfo_str] = this._forward_map(t);
    console.dir(this._forwards);
    return new Proxy(this._core, {
      get: (target, name) => {
             const core_name = target._forwards[tinfo_str][name];
             if (core_name !== undefined) {
               name = core_name;
             }
             return target[name];
           },
      set: (target, name, value) => {
             const core_name = target._forwards[tinfo_str][name];
             if (core_name !== undefined) {
               name = core_name;
             }

             target[name] = value;
             for (const on_change of this._on_change_listeners) {
               on_change();
             }
             return true;
           }
    });
  }

  on_change(handler: () => void) {
    this._on_change_listeners.push(handler);
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
      t1.fqelement.toLowerCase() === t2.fqelement.toLowerCase());
  }
}


@Injectable()
export class ClientBus {
  constructor(
      @Inject("fqelement") private _fqelement: string,
      @Inject("CompInfo") private _comp_info: CompInfo) {}

  new_atom(t: string): any {
    return new Atom(this._comp_info)
      .adapt({name: t, fqelement: this._fqelement});
  }

  new_primitive_atom(): any {
    return new PrimitiveAtom();
  }
}
