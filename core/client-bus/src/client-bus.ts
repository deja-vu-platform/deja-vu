import {
  Injectable, Inject, Component, Optional, OnChanges, SimpleChanges
} from "@angular/core";
import {Location} from "@angular/common";
import {
  ViewContainerRef, ViewChild, ReflectiveInjector, ComponentFactoryResolver
} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";

import * as _u from "underscore";
import * as _ustring from "underscore.string";

declare const System: any;


export type Type = {
  name: string;
  fqelement: string;
}

export type Field = {
  name: string;
  "type": Type;
  "of"?: Type;
}

export type TypeBond = {
  types: Type[];
  subtype: Type;
}

export type FieldBond = {
  fields: Field[];
  subfield: Field;
}

export type CompInfo = {
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

export type WidgetNavigation = {
  name: string; this_widget_name: string; this_widget: any
};

@Injectable()
export class ClientBus {
  constructor(
      @Inject("fqelement") private _fqelement: string,
      @Inject("CompInfo") private _comp_info: CompInfo,
      @Inject("WCompInfo") private _wcomp_info: WCompInfo,
      @Inject("NCompInfo") @Optional() private _ncomp_info: NCompInfo,
      @Inject("RouteConfig") @Optional() private _route_config,
      @Inject("app") private _app: string,
      @Optional() private _router: Router) {}

  new_atom(t: string): any {
    return new Atom(this._comp_info)
      .adapt({name: t, fqelement: this._fqelement});
  }

  navigate(to_widget_info: WidgetNavigation): Promise<boolean> {
    const from_widget = {
      name: to_widget_info.this_widget_name,
      fqelement: this._app
    };
    const to_widget = {name: to_widget_info.name, fqelement: this._app};
    const adapt_table = build_adapt_table(
      from_widget, to_widget, this._ncomp_info.nfbonds);

    const route = this._route_config.widgets[to_widget_info.name];
    const query_params = {};
    _u.each(_u.keys(adapt_table), target_fname => {
      const finfo = adapt_table[target_fname];
      const fvalue = to_widget_info.this_widget[finfo.host_fname];
      const ftype = finfo.ftype.name;
      if (fvalue.atom_id !== undefined) {
        query_params[target_fname] = [fvalue.atom_id, ftype];
      } else if (ftype === "Widget") {
        console.log("to be implemented");
      } else {
        query_params[target_fname] = [fvalue.value, ftype];
      }
    });
    return this._router.navigate(["/" + route], {queryParams: query_params})
      .catch(reason => {
        console.log(`Navigation to ${route} failed: ${reason}`);
      })
      .then(res => {
        if (!res) console.log(`Navigation to ${route} failed`);
        return res;
      });
  }

  // This method is only necessary for those widgets that are loaded from a
  // route. Since they are loaded via ng2's component system, the dv fields
  // are not initialized automatically and it thus needs to be done explicitly.
  // Note also that when a widget is loaded from a route, the dvAfterInit method
  // won't get called so all initialization needs to happen in the constructor
  // todo: ditch ng2's routing system and do it ourselves
  init(w, fields) {
    for (const f of fields) {
      w[f.name] = this.new_atom(f.t);
    }
  }
}


export type NCompInfo = {
  nfbonds: FieldBond[];
}

export type WCompInfo = {
  wbonds: FieldBond[];
}

type AdaptTable = {
  [target_fname: string]: {
    ftype: Type; host_fname: string; host_tname: string
  }
}

export type ReplaceMap = {
  [cliche: string]: {
    [parent_widget: string]: {
      [replaced_widget: string]: {
        replaced_by: Type; // the widget that replaces
        map: FieldReplaceMap
      }
    }
  }
}

// from replacing to replaced
export type FieldReplaceMap = {
  [replacing_f: string]: {
    type: Type; // type of the replacing field
    maps_to: string; // replaced field
  }
}

// from replaced to replacing
export type FieldReplacingMap = {
  [replaced_f: string]: {
    replacing_field_type: Type; // type of the replacing field
    replacing_field: string; // replacing field
  }
}


@Component({template: `<dv-widget [name]="name" [init]="init"></dv-widget>`})
export class RouteLoader {
  BASIC_TYPES = ["Text", "Boolean", "Date", "Datetime", "Number"];
  name: string; init: any;

  constructor(
    @Inject("RouteConfig") private _route_config,
    private _activated_route: ActivatedRoute,
    private _loc: Location, private _client_bus: ClientBus) {}

  ngOnInit() {
    this._activated_route.url.subscribe(url_segments => {
      const path = _u.pluck(url_segments, "path").join("/");
      let widget = this._route_config.routes[path];
      if (widget === undefined) { // Redirect to the main widget
        this._loc.replaceState("/");
        this.name = this._route_config.routes[""];
        this.init = {};
      } else {
        this.name = widget;
      }
    });

    this._activated_route.queryParams.subscribe(query_params => {
      this.init = _u.mapObject(query_params, (value, field) => {
        let [fvalue, ftype] = value.split(",");
        const ret = this._client_bus.new_atom(ftype);
        if (this.BASIC_TYPES.indexOf(ftype) > -1) {
          ret.value = fvalue;
        } else {
          ret.atom_id = fvalue;
        }
        return ret;
      });
    });
  }
}

@Component({
  selector: "dv-widget",
  template:  "<div #widget></div>",
  inputs: ["of", "name", "init"]
})
export class WidgetLoader implements OnChanges {
  @ViewChild("widget", {read: ViewContainerRef})
  widgetContainer: ViewContainerRef;

  of: string;
  name: string;
  init: any; // optional values to initialize the widget fields

  constructor(
      private _resolver: ComponentFactoryResolver,
      @Inject("WCompInfo") private _wcomp_info: WCompInfo,
      @Inject("ReplaceMap") private _replace_map: ReplaceMap,
      private _client_bus: ClientBus,
      @Inject("wname") @Optional() private _host_wname,
      @Inject("fqelement") @Optional() private _host_fqelement,
      @Inject("app") private _app,
      private _vc_ref: ViewContainerRef) {}

  ngOnChanges(unused_changes: SimpleChanges) {
    if (this.name === undefined) throw new Error("Widget name is required");
    if (this._host_wname === undefined) {
      throw new Error("Host widget name is required");
    }

    if (this.of === undefined) {
      this.of = this._host_fqelement;
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
    let adapt_table: AdaptTable = build_adapt_table(
      host_widget_t, widget_t, this._wcomp_info.wbonds);

    console.log(this._replace_map);

    let field_replacing_map: FieldReplacingMap = {};
    let init_fields = this.init;
    if (this._replace_map[this.of] !== undefined &&
        this._replace_map[this.of][this._host_wname]) {
      const replace_widget = this
        ._replace_map[this.of][this._host_wname][this.name];
      if (replace_widget !== undefined) {
        console.log(
            `Replacing ${this.name} with ${replace_widget.replaced_by.name} ` +
            `of ${replace_widget.replaced_by.fqelement}`);
        this.name = replace_widget.replaced_by.name;
        this.of = replace_widget.replaced_by.fqelement;

        _u.each(replace_widget.map, (rinfo, f) => {
          field_replacing_map[rinfo.maps_to] = {
            replacing_field: f, replacing_field_type: rinfo.type
          };
        });

        // map the init values
        const modified_init_fields = {};
        _u.each(this.init, (val, key) => {
          let new_key_info = field_replacing_map[key];
          if (new_key_info !== undefined) {
            modified_init_fields[new_key_info.replacing_field] = val
              .adapt(new_key_info.replacing_field_type);
          } else {
            console
              .log(`A value for field ${key} was provided but it is not ` +
                  "used in the replaced widget");
          }
        });
        init_fields = modified_init_fields;

        // Not all fields will appear in the replace map. The widget being
        // replaced could have fields that have no matched field in the
        // replacing widget
        const modified_adapt_table = {};
        _u.each(adapt_table, (finfo, target_fname) => {
          const rinfo = field_replacing_map[target_fname];
          if (rinfo !== undefined) {
            modified_adapt_table[rinfo.replacing_field] = {
              ftype: rinfo.replacing_field_type,
              host_fname: finfo.host_fname,
              host_tname: finfo.host_tname
            };
          }
        });
        adapt_table = modified_adapt_table;
      }
    }

    return this._load_widget(this.name, this.of, adapt_table, init_fields);
  }

  private _load_widget(
      name: string, fqelement: string, adapt_table: AdaptTable, init_fields) {
    let imp = "";
    if (fqelement === this._app) {
      imp = this._app;
    } else {
      const d_name = _ustring.dasherize(name).slice(1);
      imp = fqelement + `/lib/components/${d_name}/${d_name}`;
    }

    console.log(
      `Loading ${name} of ${fqelement} with adapt table ` +
      `${JSON.stringify(adapt_table, null, 2)} and init fields ` +
      _u.isEmpty(init_fields));
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
        this.widgetContainer.clear();
        this.widgetContainer.insert(component.hostView);
        return component._component;
      })
      .then(c => {
        _u.each(_u.keys(c), f => {
          const adapt_info = adapt_table[f];
          if (adapt_info !== undefined) {
            // https://github.com/angular/angular/issues/10448
            // https://stackoverflow.com/questions/40025761
            const parent_view = (<any> this._vc_ref)._element.parentView;
            let parent_component = parent_view.context;
            if (_u.isEmpty(parent_component)) {
              // it's a ng2 directive (e.g., *ngIf)
              parent_component = parent_view.parentView.context;
            }
            const host_fname = adapt_info.host_fname;
            if (parent_component[host_fname] !== undefined) {
              c[f] = parent_component[host_fname].adapt(adapt_info.ftype);
            }

            // todo: this is not necessarily an error unless we enforce that
            // all widgets need to initialize the fields they defined
            if (parent_component[host_fname] === undefined &&
                (init_fields === undefined || init_fields[f] === undefined)) {
              throw new Error(
                `Expected field ${host_fname} is undefined in ` +
                `${this._host_wname} of ${this._host_fqelement} and an ` +
                `initialization value has not been provided for it. Field is ` +
                `needed to initialize ${f} in ${name} of ${fqelement}`);
            }
          }
        });
        return c;
      })
      .then(c => { // initialize fields with init values
        if (init_fields !== undefined) {
          _u.each(_u.keys(c), f => {
            const init_value = init_fields[f];
            if (init_value !== undefined) {
              c[f] = init_value;
            }
          });
        }
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

function build_adapt_table(
  from_widget: Type, to_widget: Type, fbonds: FieldBond[]): AdaptTable {
  const ret = _u.chain(fbonds)
    // We just look at the wbonds that involve the host...
    .filter(wbond => _u.isEqual(from_widget, wbond.subfield.of))
    // ...and the widget we are loading
    .filter(wbond => !_u.chain(wbond.fields).pluck("of")
        .where(to_widget).isEmpty().value())
    .map((wbond: FieldBond) => {
      const wfield: Field = _u.chain(wbond.fields)
        .filter(f => t_equals(f.of, to_widget)).value()[0];
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
      "Adapt table for " + JSON.stringify(from_widget) + " to " +
      JSON.stringify(to_widget) + " :" + JSON.stringify(ret));
  return ret;
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
