import * as express from "express";
import morgan = require("morgan");

// the mongodb tsd typings are wrong and we can't use them with promises
const mongodb = require("mongodb");
const command_line_args = require("command-line-args");
const path = require("path");
import * as _u from "underscore";


const cli = command_line_args([
  {name: "fqelement", type: String},

  {name: "dbhost", type: String, defaultValue: "localhost"},
  {name: "dbport", type: Number, defaultValue: 27017},

  {name: "comp", type: String},
  {name: "locs", type: String},

  // Mode can be "dev" or "test".  In dev mode the development page is shown,
  // in test mode the main widget is shown
  {name: "mode", type: String, defaultValue: "dev"},
  // True if this is the cliche being run by the user
  {name: "main", type: Boolean}
]);


export class Mean {
  fqelement: string;
  db; //: mongodb.Db;
  ws; //: express.Express;
  comp: any;
  locs: any;
  debug: boolean;
  private _opts: any;

  constructor() {
    this._opts = cli.parse();
    if (this._opts.comp) {
      this.comp = JSON.parse(this._opts.comp);
    }
    this.locs = JSON.parse(this._opts.locs);
    this.fqelement = this._opts.fqelement;

    console.log(
        `Starting MEAN ${this.fqelement} at ${this.locs[this.fqelement]}`);

    const server = new mongodb.Server(
      this._opts.dbhost, this._opts.dbport,
      {socketOptions: {autoReconnect: true}});
    this.db = new mongodb.Db(`${this.fqelement}-db`, server, {w: 1});

    this.debug = this._opts.mode === "dev" && this._opts.main;
    this.ws = express();
    this.ws.use(morgan("dev"));
  }

  start() {
    if (this._opts.main) {
      console.log(`Serving public folder for main MEAN ${this.fqelement}`);
      this.ws.use(express.static("./dist/public"));
      const dist_dir = path.resolve(__dirname + "/../../../dist");
      this.ws.use("/*", (req, res) => {
        res.sendFile("/public/dv-dev/index.html", {root: dist_dir});
      });
    }

    this.ws.listen(this.locs[this.fqelement].split(":")[2], () => {
      console.log(`Listening with opts ${JSON.stringify(this._opts)}`);
    });
  }
}

export interface Widget {
  name: string;
  path?: string;
  children?: Widget[];
}

export interface UsedWidget {
  name: string;
  fqelement: string;
}

export namespace GruntTask {
  const module_map = {
    // angular bundles
    "@angular/core": "node_modules/@angular/core/bundles/core.umd.js",
    "@angular/common": "node_modules/@angular/common/bundles/common.umd.js",
    "@angular/compiler": "node_modules/@angular/compiler/bundles/" +
      "compiler.umd.js",
    "@angular/platform-browser": "node_modules/@angular/platform-browser/" +
      "bundles/platform-browser.umd.js",
    "@angular/platform-browser-dynamic": "node_modules/@angular/" +
      "platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js",
    "@angular/http": "node_modules/@angular/http/bundles/http.umd.js",
    "@angular/router": "node_modules/@angular/router/bundles/router.umd.js",
    "@angular/forms": "node_modules/@angular/forms/bundles/forms.umd.js",

    // other libraries
    "underscore": "node_modules/underscore/underscore.js",
    "underscore.string": "node_modules/underscore.string/dist/" +
      "underscore.string.min.js",
    "rxjs": "node_modules/rxjs",

    // Deja Vu stuff
    "client-bus": "node_modules/client-bus/lib/client-bus.js",
    "gql": "node_modules/gql/lib/gql.js"
  };

  const base_deps = [
    "node_modules/zone.js/dist/zone.js",
    "node_modules/reflect-metadata/Reflect.js",
    "node_modules/jquery/dist/jquery.min.js",
    "node_modules/systemjs/dist/system.src.js"
  ];

  export function task(
      grunt, name: string, widgets: Widget[] = [], main?: string,
      cliches = {}, used_widgets: UsedWidget[] = [], replace_map = {},
      comp_info = {}, wcomp_info = {}, data = {}) {
    const cliches_src = Object.keys(cliches)
        .map(p => `node_modules/${p}/lib/{components,shared}/**/` +
                  "*.{js,html,css}");
    const deps = _u.values(module_map).concat(base_deps).concat(cliches_src);

    grunt.initConfig(config(deps));
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-tslint");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-express-server");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-replace");

    grunt.registerTask("dv-mean", "Dv a mean cliche", action => {
      if (action === "dev" || action === "test") {
        grunt.log.writeln(name + " " + action);

        const app_widgets_js: WidgetJs[] = widget_definitions(
          app_widgets(widgets, wcomp_info, data));
        const cliche_widgets_js: WidgetJs[] = cliche_widgets(used_widgets);
        const all_widgets_js: WidgetJs[] = app_widgets_js
          .concat(cliche_widgets_js);

        const cliches_servers_info: ClicheServer[] = cliches_servers(
          cliches, name);
        const locs = _u
          .reduce(cliches_servers_info, (memo, cs: ClicheServer) => {
            memo[cs.fqelement] = cs.loc;
            return memo;
          }, {});
        const express_config_info = express_config(
          cliches_servers_info, name, comp_info, locs, action);

        let route_config_str = "[]";
        if (action === "test") {
          route_config_str = JSON.stringify(route_config(widgets, main))
            .replace(/\"component\":\"([^"\""]*)\"/g, "component: $1");
        }

        const replace_patterns = [
          {match: "name", replacement: name},
          {match: "module_map", replacement: module_map},
          {match: "replace_map", replacement: replace_map},
          {match: "cliches", replacement: _u.keys(cliches)},
          {match: "comp_info", replacement: comp_info},
          {match: "wcomp_info", replacement: wcomp_info},
          {match: "mode", replacement: action},

          {match: "wid_names", replacement: _u.pluck(app_widgets_js, "name")},
          {match: "wid_imports", replacement: _u
            .pluck(cliche_widgets_js, "import_stmt").join("\n")},
          {match: "wid_classes", replacement: "[" + _u
            .pluck(all_widgets_js, "class_name").join() + "]"},

          {match: "wid_selectors", replacement: _u
            .pluck(app_widgets_js, "selector").join("\n")},

          {match: "route_config", replacement: route_config_str},
          {match: "locs", replacement: locs},
          {match: "wid_definitions", replacement: _u
            .pluck(app_widgets_js, "definition").join("\n")},
          {match: "server_data", replacement: server_data(data, comp_info)}
        ];

        grunt.config.merge({
          replace: {dev: {options: {patterns: replace_patterns}}},
          express: _u.reduce(express_config_info, (memo, cs: ClicheServer) => {
              memo[cs.fqelement] = {options: cs.express_config};
              return memo;
            }, {})
        });

        grunt.task.run(["clean:dev"]);
        grunt.task.run(["replace:dev"]);
        grunt.task.run(["tslint", "ts:dev_client", "ts:dev_server"]);
        grunt.task.run(["copy:dev"]);
        grunt.task.run(["express", "watch"]);
      } else if (action === "lib") {
        grunt.log.writeln(name + " lib");
        grunt.task.run(["clean:lib"]);
        grunt.task.run(["tslint", "ts:lib_client", "ts:lib_server"]);
        grunt.task.run(["copy:lib"]);
      } else if (action === "clean") {
        grunt.task.run("clean");
      } else {
        grunt.fail.fatal(
          `Unrecognized action ${action}. Choose one of dev, test, or lib`);
      }
    });
  }

  interface TypeInfo {
    name: string;
    fqelement: string;
  }

  interface FieldInfo {
    name: string;
    type: TypeInfo;
    of: TypeInfo;
    data: any;
  }

  interface WidgetJs {
    import_stmt: string;
    class_name: string;
    name: string;
    selector?: string;
    fields?: FieldInfo[];
    definition?: string;
    path?: string;
  }

  function app_widgets(app_widgets: Widget[], wcomp_info, data): WidgetJs[] {
    let flat_widgets: Widget[] = _u.chain(app_widgets)
        .pluck("children")
        .without(null, undefined)
        .flatten()
        .value();
    flat_widgets = flat_widgets
      .concat(_u.map(app_widgets, w => ({name: w.name, path: w.path})));
    flat_widgets = _u.uniq(flat_widgets, false, w => w.name);

    const all_widgets_fields = _u.pluck(wcomp_info.wbonds, "subfield");
    return _u.map(flat_widgets, fw => ({
      import_stmt: imp(fw.name, ".."),
      class_name: component(fw.name),
      name: fw.name,
      selector: `<dv-widget name="${fw.name}"></dv-widget>`,
      fields: _u
        .chain(all_widgets_fields)
        .filter(f => f.of.name === fw.name)
        .map(f => {
          if (data[fw.name] !== undefined) {
            f.data = data[fw.name][0][f.name];
          }
          return f;
        })
        .value(),
      path: fw.path
    }));
  }

  function server_data(data, comp_info): string {
    const create_atom = atom => `
      bus.create_atom(
          "${atom.type}",
          "${atom.data.atom_id}",
           ${JSON.stringify(_u.omit(atom.data, "atom_id"))})
    `;
    const all_tbonds = _u
      .chain(comp_info.tbonds)
      .pluck("subtype").pluck("name")
      .uniq()
      .value();
    return _u
        .chain(
           _u.values(
             _u.mapObject(_u.pick(data, ...all_tbonds), (atoms, atom_type) => _u
               .map(atoms, atom => ({
                 type: atom_type,
                 data: atom
               })))))
        .flatten()
        .map(create_atom)
        .value()
        .join(";");
  }

  function cliche_widgets(cliche_widgets: UsedWidget[]): WidgetJs[] {
    return _u.chain(cliche_widgets)
      .map((cw: UsedWidget) => {
        cw.fqelement = cliche(cw.fqelement);
        return cw;
      })
      .unique(false, cw => cw.name + cw.fqelement)
      .map(cw => ({
        import_stmt: imp(cw.name, cw.fqelement + "/lib"),
        class_name: component(cw.name),
        name: cw.name
      }))
      .value();
  }

  function route_config(app_widgets: Widget[], main: string): any[] {
    const wid_with_paths = _u.filter(app_widgets, w => w.path !== undefined);
    const default_path = _u.findWhere(wid_with_paths, {name: main}).path;
    const routify = w => {
      if (w.children === undefined) {
        return {path: w.path, component: component(w.name)};
      } else {
        return {
          path: w.path, component: component(w.name),
          children: _u.map(w.children, routify)
        };
      }
    };
    return  _u
      .map(wid_with_paths, routify)
      .concat({path: "", redirectTo: default_path, pathMatch: "full"});
  }

  interface ClicheServer {
    fqelement: string;
    loc: string;
    port: number;
    express_config;
  }

  function cliches_servers(cliches, name: string): ClicheServer[] {
    const ret = [];
    ret.push({fqelement: name, loc: "http://localhost:3000"});

    let port = 3001;
    _u.each(cliches, (instances_number, name) => {
      for (let i = 1; i <= instances_number; ++i) {
        const fqelement = (instances_number > 1) ? name + "-" + i : name;
        ret.push({
          fqelement: fqelement,
          loc: "http://localhost:" + port,
          port: port
        });
        ++port;
      }
    });
    return ret;
  }

  function express_config(
      cliches: ClicheServer[], name: string, comp_info, locs, action: string) {
    return _u.map(cliches, (cs: ClicheServer) => {
      const comp_info_str: string = JSON.stringify(comp_info);
      const locs_str: string = JSON.stringify(locs);
      if (cs.fqelement === name) {
        cs.express_config = {
          script: "dist/dv-dev/app.js",
          background: true,
          args: [
            "--main", `--mode=${action}`, `--fqelement=${cs.fqelement}`,
            `--comp=${comp_info_str}`, `--locs=${locs_str}`
          ],
          port: cs.port
        };
      } else {
        cs.express_config = {
          script: `node_modules/${cliche(cs.fqelement)}/lib/app.js`,
          background: true,
          args: [
            `--fqelement=${cs.fqelement}`,
            `--comp=${comp_info_str}`, `--locs=${locs_str}`
          ],
          port: cs.port
        };
      }
      return cs;
    });
  }

  function widget_definitions(widgets: WidgetJs[]): WidgetJs[] {
    const field_defs = w => _u
      .chain(w.fields)
      .filter(f => f.data)
      .pluck("name")
      .value()
      .join(";");
    const field_init = w => _u
      .map(w.fields, (f: FieldInfo) => `field("${f.name}", "${f.type.name}")`)
      .join();
    const field_assignments = w => _u
      .chain(w.fields)
      .filter(f => f.data)
      .map(f => {
        let ret = "";
        if (f.type.name === "Text") {
          ret = `this.${f.name}.value = "${f.data}"`;
        } else if (f.type.name === "Boolean") {
          ret = `this.${f.name}.value = ${f.data}$`;
        } else {
          throw new Error("to be implemented");
        }
        return ret;
      })
      .value()
      .join(";");

    const wid_with_paths = _u
      .chain(widgets)
      .filter(w => w.path !== undefined)
      .pluck("name")
      .value();
    const template_route_widget = w => `
      @AppWidget()
      export class ${w.class_name} {
        ${field_defs(w)};
        constructor(client_bus: ClientBus) {
          client_bus.init(this, [${field_init(w)}]);
          ${field_assignments(w)};
        }
      }
    `;
    const template_inner_widget = w => `
      @AppWidget()
      export class ${w.class_name} {
        ${field_defs(w)};
        constructor(client_bus: ClientBus) {
          client_bus.init(this, [${field_init(w)}]);
        }
        dvAfterInit() {
          ${field_assignments(w)};
        }
      }
    `;
    return _u.map(widgets, (w: WidgetJs) => {
      let template = template_inner_widget;
      if (_u.contains(wid_with_paths, w.name)) {
        template = template_route_widget;
      }
      w.definition = template(w);
      return w;
    });
  }

  function imp(w_name: string, w_imp_prefix: string): string {
    const hyphen = w => w.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    return `import {${component(w_name)}} from ` +
      `"${w_imp_prefix}/components/${hyphen(w_name)}/` +
      `${hyphen(w_name)}";`;
  }

  function component(w_name: string): string {
    return `${w_name}Component`;
  }

  function cliche(fqelement: string): string {
    let ret = fqelement;
    const fqelement_split = fqelement.split("-");
    if (fqelement_split.length === 4) {
      ret = fqelement_split.slice(0, -1).join("-");
    }
    return ret;
  }

  function config(deps: string[]) {
    const ts_base_opts = {
      verbose: true,
      target: "es6",
      moduleResolution: "node",
      sourceMap: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      removeComments: false,
      noImplicitAny: false,
      rootDir: "src"
    };
    const ts_client_opts = _u.extend({module: "system"}, ts_base_opts);
    const ts_server_opts = _u.extend({module: "commonjs"}, ts_base_opts);

    const typings = "typings/index.d.ts";
    const components = "src/components/**/*.ts";
    const shared = "src/shared/**/*.ts";
    const server = "src/*.ts";

    return {
      ts: {
        dev_client: {
          src: [typings, shared, components, "src/dv-dev/!(app).ts"],
          outDir: ["dist/public"],
          options: ts_client_opts
        },
        dev_server: {
          src: [typings, shared, server, "src/dv-dev/app.ts"],
          outDir: ["dist"],
          options: ts_server_opts
        },
        lib_client: {
          src: [typings, shared, components],
          outDir: ["lib"],
          options: _u.extend({declaration: true}, ts_client_opts)
        },
        lib_server: {
          src: [typings, shared, server],
          outDir: ["lib"],
          options: _u.extend({declaration: true}, ts_server_opts)
        }
      },

      copy: {
        dev: {
          files: [
            {
              expand: true,
              cwd: "src",
              src: ["components/**/*.{html,css,js}"],
              dest: "dist/public"
            },
            {
              expand: true,
              src: deps,
              dest: "dist/public"
            },
            {
              expand: true,
              src: ["node_modules/rxjs/**"],
              dest: "dist/public"
            },
            {
              expand: true,
              cwd: "src/dv-dev",
              src: ["**/*.{html,css,js}"],
              dest: "dist/public/dv-dev"
            }
          ]
        },
        lib: {
          files: [
            {
              expand: true,
              cwd: "src",
              src: ["components/**/*.{html,css,js}"],
              dest: "lib"
            }
          ]
        }
      },

      tslint: {
        options: {
          configuration: {
            "rules": {
              "class-name": true,
              "curly": false,
              "eofline": true,
              "indent": "spaces",
              "max-line-length": [true, 80],
              "member-ordering": [true,
                "public-before-private",
                "static-before-instance",
                "variables-before-functions"
              ],
              "no-arg": true,
              "no-construct": true,
              "no-duplicate-variable": true,
              "no-empty": true,
              "no-eval": true,
              "no-trailing-whitespace": true,
              "no-unused-expression": true,
              "no-unused-variable": true,
              "no-unreachable": true,
              "no-use-before-declare": true,
              "one-line": [true,
                "check-open-brace",
                "check-catch",
                "check-else",
                "check-whitespace"
              ],
              "quotemark": [true, "double"],
              "semicolon": true,
              "triple-equals": true,
              "variable-name": false
            }
          }
        },
        default: {
          files: {
            src: ["src/!(dv-dev)/**/*.ts"]
          }
        }
      },

      clean: {
        default: {src: ["dist", "lib"]},
        dev: {src: ["dist", "src/dv-dev"]},
        lib: {src: ["lib"]}
      },

      watch: {
        express: {
          files: ["src/**/*.ts"],
          tasks: ["dv-mean:serve"],
          options: {spawn: false}
        }
      },

      replace: {
        dev: {
          files: [
            {
              expand: true,
              flatten: true,
              src: "node_modules/mean-loader/lib/dev/*",
              dest: "src/dv-dev",
              rename: (dst, src) => dst + "/" + src.replace(".template", "")
            }
          ]
        }
      }
    };
  }
}
