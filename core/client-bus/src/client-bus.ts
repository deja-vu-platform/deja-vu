import {Injectable, Inject, Component, Optional} from "@angular/core";
import {
  ViewContainerRef, ViewChild, ReflectiveInjector, ComponentFactoryResolver
} from "@angular/core";

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
  "of"?: Type;
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
    if (this._comp_info.fbonds === undefined) return {};
    const forward_map = {};
    // find the field bonds where t is part of, map field to core
    for (const fbond of this._comp_info.fbonds) {
      for (const field of fbond.fields) {
        if (t_equals(field.of, t)) {
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

  // This method is only necessary for those widgets that are loaded from a
  // route. Since they are loaded via ng2's component system, the dv fields
  // are not initialized automatically and it thus needs to be done explicitly.
  // Note also that when a widget is loaded from a route, the dvAfterInit method
  // won't get called so all initialization needs to happen in the constructor
  // todo: ditch ng2's routing system and do it ourselves
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
  inputs: ["of", "name", "fields"]
})
export class WidgetLoader {
  @ViewChild("widget", {read: ViewContainerRef})
  widgetContainer: ViewContainerRef;

  called: boolean;

  of: string;
  name: string;
  fields;

  constructor(
      private _resolver: ComponentFactoryResolver,
      @Inject("WCompInfo") private _wcomp_info: WCompInfo,
      @Inject("ReplaceMap") private _replace_map,
      private _client_bus: ClientBus,
      @Inject("wname") @Optional() private _host_wname,
      @Inject("fqelement") @Optional() private _host_fqelement,
      @Inject("app") private _app) {}

  _adapt_table() {
    if (this.name === undefined) throw new Error("Widget name is required");
    if (this._host_wname === undefined) {
      throw new Error("Host widget name is required");
    }

    // host_widget_t is the widget that contains the widget being loaded
    const host_widget_t = {
      name: this._host_wname,
      fqelement: this._host_fqelement
    };
    // widget_t is the widget we are loading
    const widget_t = {name: this.name, fqelement: this.of};
    if (widget_t.fqelement === undefined) {
      widget_t.fqelement = this._host_fqelement;
    }
    const ret = _u.chain(this._wcomp_info.wbonds)
      // We just look at the wbonds that involve the host...
      .filter(wbond => _u.isEqual(host_widget_t, wbond.subfield.of))
      // ...and the widget we are loading
      .filter(wbond => !_u.chain(wbond.fields).pluck("of")
          .where(widget_t).isEmpty().value())
      .map((wbond: FieldBond) => {
        const wfield: Field = _u.chain(wbond.fields)
          .filter(f => t_equals(f.of, widget_t)).value()[0];
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
    if (this.called) return;
    this.called = true;

    if (this.of === undefined) {
      this.of = this._host_fqelement;
    }

    const adapt_table = this._adapt_table();

    console.log(this._replace_map);

    let replace_field_map = {};
    if (this._replace_map[this.of] !== undefined &&
        this._replace_map[this.of][this._host_wname]) {
      const replace_widget = this.
        _replace_map[this.of][this._host_wname][this.name];
      if (replace_widget !== undefined) {
        console.log(
            `Replacing ${this.name} with ${replace_widget.replaced_by.name} ` +
            `of ${replace_widget.replaced_by.fqelement}`);
        this.name = replace_widget.replaced_by.name;
        this.of = replace_widget.replaced_by.fqelement;
        replace_field_map = replace_widget.map;
      }
    }


    return this._load_widget(
        this.name, this.of, adapt_table, replace_field_map);
  }

  private _load_widget(
      name: string, fqelement: string, adapt_table, replace_field_map) {
    let imp = "";
    if (fqelement === this._app) {
      imp = this._app;
    } else {
      const d_name = _ustring.dasherize(name).slice(1);
      imp = fqelement + `/lib/components/${d_name}/${d_name}`;
    }

    console.log(`Loading ${name} of ${fqelement}`);
    return System
      .import(imp)
      .then(mod => mod[name + "Component"])
      .then(c => {
        if (c === undefined) {
          throw new Error(`Component ${name} not found`);
        }
        return c;
      })
      .then(c => this._resolver.resolveComponentFactory(c))
      .then(factory => {
        const injector = ReflectiveInjector
            .resolveAndCreate(
              [{provide: "fqelement", useValue: fqelement}],
              this.widgetContainer.parentInjector);
        const component = factory.create(injector);
        this.widgetContainer.insert(component.hostView);
        return component._component;
      })
      .then(c => {
        if (c.fields === undefined) {
          c.fields = {};
        }
        c.fields = _u.extend(c.fields, this.fields);
        _u.each(_u.keys(c), f => {
          if (f === "fields") return;
          const replace_field_info = replace_field_map[f];
          const adapt_info = adapt_table[f];

          if (replace_field_info !== undefined) {
            c[f] = this.fields[replace_field_info.maps_to]
              .adapt(replace_field_info.type);
            c.fields[f] = c[f];
          } else if (adapt_info !== undefined) {
            const host_fname = adapt_info.host_fname;
            if (this.fields[host_fname] === undefined) {
              throw new Error(`Expected field ${host_fname} is undefined`);
            }
            c[f] = this.fields[host_fname].adapt(adapt_info.ftype);
            c.fields[f] = c[f];
          } else if ( // let cliches pass info directly to their widgets
            fqelement === this._host_fqelement && c.fields[f] !== undefined) {
            c[f] = c.fields[f];
          }
        });
        return c;
      })
      .then(c => { /* hack */
        if (c._graphQlService !== undefined) {
          c._graphQlService.reset_fqelement(fqelement);
        }
        return c;
      })
      .then(c => {
        if (c.dvAfterInit !== undefined) {
          c.dvAfterInit();
        }
        return c;
      });
  }
}


export interface WidgetMetadata {
  fqelement: string;
  ng2_directives?: any[];
  ng2_providers?: any[];
  template?: string;
  styles?: string[];
  external_styles?: string[];
}

export function Widget(options: WidgetMetadata) {
  return (target: Function): any => {
    const dname = _ustring.dasherize(target.name).slice(1, -10);
    const metadata = {selector: dname};

    let providers = [{provide: "wname", useValue: target.name.slice(0, -9)}];
    if (options.ng2_providers !== undefined) {
      providers = providers.concat(options.ng2_providers);
    }
    metadata["providers"] = providers;

    let directives = [];
    if (options.ng2_directives !== undefined) {
      directives = directives.concat(options.ng2_directives);
    }
    metadata["directives"] = directives;
    const system_map = System.getConfig().map;
    let module_id = system_map[options.fqelement];
    if (module_id === undefined) {
      module_id = system_map[options.fqelement + "/lib"];
    } else {
      module_id = module_id + "/lib";
    }
    if (options.template !== undefined) {
      metadata["template"] = options.template;
    } else {
      metadata["templateUrl"] = `${module_id}/components/` +
        `${dname}/${dname}.html`;
    }

    if (options.styles !== undefined) {
      metadata["styles"] = options.styles;
    } else {
      let style_url = `${module_id}/components/${dname}/${dname}.css`;
      // https://github.com/angular/angular/issues/4974
      if (module_id === "") {
        style_url = `components/${dname}/${dname}.css`;
      }
      metadata["styleUrls"] = [style_url];
    }
    if (options.external_styles !== undefined) {
      if (metadata["styleUrls"] === undefined) {
        metadata["styleUrls"] = [];
      }
      metadata["styleUrls"] = metadata["styleUrls"]
        .concat(options.external_styles);
    }

    return Component(metadata)(target);
  };
}
