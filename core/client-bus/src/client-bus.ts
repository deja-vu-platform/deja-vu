/// <reference path="../typings/tsd.d.ts" />
import {Injectable, Inject, Component, Optional} from "angular2/core";
import {DynamicComponentLoader, Injector, ElementRef} from "angular2/core";
import {provide} from "angular2/core";

import * as _u from "underscore";
import * as _ustring from "underscore.string";

declare const System: any;


export interface Type {
  name: string;
  fqelement: string;
}

export interface Field {
  name: string;
  "type": Type;
  widget?: Type;
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
  private _forwards = {};
  private _on_change_listeners: (() => Promise<Boolean>)[] = [];
  private _on_after_change_listeners: (() => Promise<Boolean>)[] = [];
  private _core;

  constructor(private _comp_info: CompInfo) {
    this._core = this;
  }

  adapt(t: Type) {
    const tinfo_str = JSON.stringify(t);
    this._forwards[tinfo_str] = this._forward_map(t);
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

             Promise
               .all(this._on_change_listeners.map(oc => oc()))
               .then(_ => Promise
                 .all(this._on_after_change_listeners.map(ac => ac())));
             return true;
           }
    });
  }

  on_change(handler: () => Promise<Boolean>) {
    this._on_change_listeners.push(handler);
  }

  on_after_change(handler: () => Promise<Boolean>) {
    this._on_after_change_listeners.push(handler);
  }

  // from a type to the core
  _forward_map(t: Type) {
    if (this._comp_info === undefined) return {};
    const forward_map = {};
    // find the field bonds where t is part of, map field to core
    for (const fbond of this._comp_info.fbonds) {
      for (const field of fbond.fields) {
        if (t_equals(field.type, t)) {
          // use the subfield name
          forward_map[field.name] = fbond.subfield.name;
        }
      }
    }
    return forward_map;
  }
}


function t_equals(t1: Type, t2: Type) {
  return (
    t1.name.toLowerCase() === t2.name.toLowerCase() &&
    t1.fqelement.toLowerCase() === t2.fqelement.toLowerCase());
}


export function field(name: string, t: string) {
  return {name: name, t: t};
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

  init(w, fields) {
    w.fields = {};
    for (const f of fields) {
      w[f.name] = this.new_atom(f.t);
      w.fields[f.name] = w[f.name];
    }
  }
}


export interface WCompInfo {
  wbonds: FieldBond[];
}


@Component({
  selector: "dv-widget",
  template:  "<div #widget></div>",
  inputs: ["fqelement", "name", "fields"]
})
export class WidgetLoader {
  fqelement: string;
  name: string;
  fields;

  constructor(
      private _dcl: DynamicComponentLoader, private _element_ref: ElementRef,
      @Inject("WCompInfo") private _wcomp_info: WCompInfo,
      private _client_bus: ClientBus,
      @Inject("wname") @Optional() private _host_wname,
      @Inject("fqelement") @Optional() private _host_fqelement) {}

  _adapt_table() {
    if (this._host_wname === undefined) return {};
    const host_widget_t = {
      name: this._host_wname,
      fqelement: this._host_fqelement
    };
    const widget_t = {name: this.name, fqelement: this.fqelement};
    if (widget_t.fqelement === undefined) {
      widget_t.fqelement = this._host_fqelement;
    }
    const ret = _u.chain(this._wcomp_info.wbonds)
      .filter(wbond => t_equals(wbond.subfield.widget, host_widget_t))
      .filter(wbond => !_u.chain(wbond.fields).pluck("widget")
          .where(widget_t).isEmpty().value())
      .map((wbond: FieldBond) => {
        const wfield: Field = _u.chain(wbond.fields)
          .filter(f => t_equals(f.widget, widget_t)).value()[0];
        return {
          fname: wfield.name,
          info: {
            ftype: wfield.type,
            host_fname: wbond.subfield.name,
            host_tname: wbond.subfield.type.name
          }
        };
      })
      .reduce((memo, finfo) => {
        memo[finfo.fname] = finfo.info;
        return memo;
      }, {})
      .value();

    console.log(
        "Adapt table for " + JSON.stringify(host_widget_t) + " to " +
        JSON.stringify(widget_t) + " :" +
        JSON.stringify(ret));
    return ret;
  }

  ngOnInit() {
    const adapt_table = this._adapt_table();
    const d_name = _ustring.dasherize(this.name).slice(1);
    let imp_string_prefix = "";
    let providers = [];
    if (this.fqelement !== undefined &&
        /* hack */ this.fqelement !== "dv-samples-bookmark") {
      imp_string_prefix =  `${this.fqelement}/lib/`;
      const fqelement_split = this.fqelement.split("-");
      if (fqelement_split.length === 4) {
        imp_string_prefix =  `${fqelement_split.slice(0, 3).join("-")}/lib/`;
      }
      providers = [provide("fqelement", {useValue: this.fqelement})];
    }

    console.log(`Loading ${this.name} of ${this.fqelement}`);

    System.import(imp_string_prefix + `components/${d_name}/${d_name}`)
      .then(mod => this._dcl
          .loadIntoLocation(
            mod[this.name + "Component"], this._element_ref, "widget",
            Injector.resolve(providers)))
      .then(componentRef => componentRef.instance)
      .then(c => {
        if (c.fields === undefined) {
          c.fields = {};
        }
        c.fields = _u.extend(c.fields, this.fields);
        _u.each(_u.keys(c), f => {
          const adapt_info = adapt_table[f];
          if (adapt_info !== undefined) {
            c[f] = this.fields[adapt_info.host_fname].adapt(adapt_info.ftype);
            c.fields[f] = c[f];
          }
        });
        return c;
      })
      .then(c => {
        if (c.dvAfterInit !== undefined) {
          c.dvAfterInit();
        }
      });
  }
}


export interface WidgetMetadata {
  ng2_directives?: any[];
  ng2_providers?: any[];
  template?: string;
  styles?: string[];
}


const WidgetLoaderRef = WidgetLoader;

export function Widget(options?: WidgetMetadata) {
  if (options === undefined) options = {};

  return (target: Function): any => {
    const dname = _ustring.dasherize(target.name).slice(1, -10);
    const metadata = {selector: dname};

    let providers = [provide("wname", {useValue: target.name.slice(0, -9)})];
    if (options.ng2_providers !== undefined) {
      providers = providers.concat(options.ng2_providers);
    }
    metadata["providers"] = providers;

    let directives = [WidgetLoaderRef];
    if (options.ng2_directives !== undefined) {
      directives = directives.concat(options.ng2_directives);
    }
    metadata["directives"] = directives;

    if (options.template !== undefined) {
      metadata["template"] = options.template;
    } else {
      metadata["templateUrl"] = `./components/${dname}/${dname}.html`;
    }

    if (options.styles !== undefined) {
      metadata["styles"] = options.styles;
    } else {
      metadata["styleUrls"] = [`./components/${dname}/${dname}.css`];
    }

    return Component(metadata)(target);
  };
}
