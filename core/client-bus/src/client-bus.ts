import {
  Injectable, Inject, Input, Component, Optional, OnChanges, OnInit,
  SimpleChanges, Directive, HostListener
} from "@angular/core";
import {Location} from "@angular/common";
import {
  ViewContainerRef, ViewChild, ReflectiveInjector, ComponentFactoryResolver
} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";

import * as _ from "lodash";
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

export type Handler = () => Promise<void> | void;
export interface OnChange {
  on_change: (handler: Handler) => void;
  on_after_change: (handler: Handler) => void;
}

export interface Atom extends OnChange { atom_id: string; }

export interface Time { hour: number; minute: number; second: number; }
export interface Datetime extends Date, Time {}
export interface WidgetValue {
  name: string; this_widget_name: string; this_widget: any;
}

// T should be one of string, boolean, number, Date, Datetime, Time, WidgetValue
export interface PrimitiveAtom<T> extends OnChange { value: T; }

export class AdaptableAtom {
  private readonly _forwards = {};
  private readonly _on_change_listeners: Handler[] = [];
  private readonly _on_after_change_listeners: Handler[] = [];
  private readonly _core;

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

  on_change(handler: Handler): void {
    this._on_change_listeners.push(handler);
  }

  on_after_change(handler: Handler): void {
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


export type PrimitiveType = "string" | "boolean" | "number" |
  "date" | "datetime" | "time" | "Widget";


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

  new_atom<T extends Atom>(t: string): T {
    return this._create_atom(t);
  }

  new_primitive_atom<T>(t: PrimitiveType): PrimitiveAtom<T> {
    return this._create_atom(t);
  }

  navigate(to_widget_info: WidgetValue): Promise<boolean> {
    const from_widget = {
      name: to_widget_info.this_widget_name,
      fqelement: this._app
    };
    const to_widget = {name: to_widget_info.name, fqelement: this._app};
    const adapt_table = build_adapt_table(
      from_widget, to_widget, this._ncomp_info.nfbonds);

    const route = this._route_config.widgets[to_widget_info.name];
    const query_params = {};
    _.each(_.keys(adapt_table), target_fname => {
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

  private _create_atom(t: string) {
    return new AdaptableAtom(this._comp_info)
      .adapt({name: t, fqelement: this._fqelement});
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
export class RouteLoader implements OnInit {
  PRIMITIVE_TYPES = ["text", "boolean", "date", "datetime", "number"];
  name: string;
  init: {[key: string]: OnChange};

  constructor(
    @Inject("RouteConfig") private _route_config,
    private _activated_route: ActivatedRoute,
    private _loc: Location, private _client_bus: ClientBus) {}

  ngOnInit() {
    this._activated_route.url.subscribe(url_segments => {
      const path = _.map(url_segments, "path").join("/");
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
      this.init = _.mapValues(query_params, (value, field) => {
        let [fvalue, ftype] = value.split(",");
        let ret: OnChange;
        if (this.PRIMITIVE_TYPES.indexOf(ftype) > -1) {
          ret = this._client_bus.new_primitive_atom(ftype);
          (<PrimitiveAtom<any>>ret).value = fvalue;
        } else {
          ret = this._client_bus.new_atom(ftype);
          (<Atom>ret).atom_id = fvalue;
        }
        return ret;
      });
    });
  }
}

@Component({selector: "dv-widget", template: "<div #widget></div>"})
export class WidgetLoader implements OnChanges {
  @ViewChild("widget", {read: ViewContainerRef})
  widgetContainer: ViewContainerRef;

  @Input() name: string;
  @Input() of: string;
  // optional values to initialize the widget fields
  @Input() init: {[key: string]: AdaptableAtom};

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

        _.each(replace_widget.map, (rinfo, f) => {
          field_replacing_map[rinfo.maps_to] = {
            replacing_field: f, replacing_field_type: rinfo.type
          };
        });

        // map the init values
        const modified_init_fields = {};
        _.each(this.init, (val, key) => {
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
        _.each(adapt_table, (finfo, target_fname) => {
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
      _.isEmpty(init_fields));
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
        if (c._dv_fields !== undefined) {
          for (const f of c._dv_fields) {
            if (c[f.name] !== undefined) {
              throw new Error("To be implemented");
            }

            const comp_info = this.widgetContainer.injector.get("CompInfo");
            c[f.name] = new AdaptableAtom(comp_info)
              .adapt({name: f.tname, fqelement: fqelement});
          }
        }
        return c;
      })
      .then(c => {
        _.each(_.keys(c), f => {
          const adapt_info = adapt_table[f];
          if (adapt_info !== undefined) {
            const host_fname = adapt_info.host_fname;

            // https://github.com/angular/angular/issues/10448
            // https://stackoverflow.com/questions/40025761
            let parent_view = (<any> this._vc_ref)._element.parentView;

            const skips = ["NgForRow", "Object"]; // ngIf shows up as "Object"
            while (skips.indexOf(parent_view.context.constructor.name) >= 0) {
              parent_view = parent_view.parentView;
            }
            const parent_widget = parent_view.context;

            if (parent_widget[host_fname] !== undefined) {
              c[f] = parent_widget[host_fname].adapt(adapt_info.ftype);
            } else {
              throw new Error(
                `Expected field ${host_fname} is undefined in ` +
                `${this._host_wname} of ${this._host_fqelement}. All Deja Vu ` +
                `fields need to be marked with @Field()`);
            }
          }
        });
        return c;
      })
      .then(c => { // initialize fields with init values
        if (init_fields !== undefined) {
          _.each(_.keys(c), f => {
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
  const ret = _(fbonds)
    // We just look at the wbonds that involve the host...
    .filter(wbond => _.isEqual(from_widget, wbond.subfield.of))
    // ...and the widget we are loading
    .filter(wbond => !_(wbond.fields).map("of").filter(to_widget).isEmpty())
    .map((wbond: FieldBond) => {
      const wfield: Field = _(wbond.fields)
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
    }, {});

  console.log(
      "Adapt table for " + JSON.stringify(from_widget) + " to " +
      JSON.stringify(to_widget) + " :" + JSON.stringify(ret));
  return ret;
}


/**
 * Lifecycle hook that is called after all Deja Vu fields are initialized
 **/
export interface AfterInit { dvAfterInit: () => void; }


export type WidgetMetadata = {
  fqelement: string;
  template?: string;
  styles?: string[];
  external_styles?: string[];

  ng2_directives?: any[];
  ng2_providers?: any[];
}

/**
 * Marks a class as a Deja Vu widget and collects configuration metadata
 **/
export function Widget(options: WidgetMetadata) {
  return (target: Function) => {
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

/**
 * Use to create a link to another widget
 *
 * <a dvLink={{my_widget}}>Link</a>
 * Shared fields are propagated via query string
 * TODO: Take name of widget instead of widget object
 **/
@Directive({selector: "[dvLink]"})
export class DvLink {
  private widget: WidgetValue;

  constructor(private _clientBus: ClientBus) {}

  @Input()
  set dvLink(widget: WidgetValue | PrimitiveAtom<WidgetValue>) {
    if ((<WidgetValue> widget).name) {
      this.widget = (<WidgetValue> widget);
    } else {
      this.widget = (<PrimitiveAtom<WidgetValue>> widget).value;
    }
  }

  @HostListener("click")
  onClick(): boolean {
    this._clientBus.navigate(this.widget);
    return true;
  }
}

/**
 * Marks an instance member of a class as a Deja Vu field
 *
 * After the widget loads, Deja Vu will initialize the field with a valid
 * Atom of the given type
 **/
export function Field(tname: string) {
  return (target, fname: string) => {
    if (target._dv_fields === undefined) target._dv_fields = [];
    target._dv_fields.push({name: fname, tname: tname});
  };
}
