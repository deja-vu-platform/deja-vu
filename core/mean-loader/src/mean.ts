import * as express from "express";
import morgan = require("morgan");

// the mongodb tsd typings are wrong and we can't use them with promises
const mongodb = require("mongodb");
const command_line_args = require("command-line-args");
const fs = require("fs");
const path = require("path");
import * as _u from "underscore";


const cli = command_line_args([
  {name: "fqelement", type: String},

  {name: "dbhost", type: String, defaultValue: "localhost"},
  {name: "dbport", type: Number, defaultValue: 27017},

  {name: "comppath", type: String},
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
    if (this._opts.comppath) {
      this.comp = JSON.parse(fs.readFileSync(this._opts.comppath, "utf8"));
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
  path: string;
  children?: Widget[];
}

export interface UsedWidget {
  name: string;
  fqelement: string;
}

export namespace GruntTask {
  export function task(
      grunt, name: string, widgets?: Widget[], main?: string, patterns?,
      used_widgets?: UsedWidget[]) {
    widgets = widgets === undefined ? [] : widgets;
    patterns = patterns === undefined ? {} : patterns;
    used_widgets = used_widgets === undefined ? [] : used_widgets;

    const npm = "node_modules";
    const patterns_src = Object.keys(patterns)
        .map(p => `${npm}/${p}/lib/{components,shared}/**/` +
                  "*.{js,html,css}");
    let deps = [
      `${npm}/zone.js/dist/zone.js`,
      `${npm}/reflect-metadata/Reflect.js`,
      `${npm}/jquery/dist/jquery.min.js`,
      `${npm}/systemjs/dist/system.src.js`
    ];
    deps = deps.concat(patterns_src);

    let module_map = {
      // angular bundles
      "@angular/core": `${npm}/@angular/core/bundles/core.umd.js`,
      "@angular/common": `${npm}/@angular/common/bundles/common.umd.js`,
      "@angular/compiler": `${npm}/@angular/compiler/bundles/compiler.umd.js`,
      "@angular/platform-browser": `${npm}/@angular/platform-browser/bundles/` +
        "platform-browser.umd.js",
      "@angular/platform-browser-dynamic": `${npm}/@angular/` +
        "platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js",
      "@angular/http": `${npm}/@angular/http/bundles/http.umd.js`,
      "@angular/router": `${npm}/@angular/router/bundles/router.umd.js`,
      "@angular/forms": `${npm}/@angular/forms/bundles/forms.umd.js`,

      // other libraries
      "underscore": `${npm}/underscore/underscore.js`,
      "underscore.string": `${npm}/underscore.string/dist/` +
        "underscore.string.min.js",
      "rxjs": `${npm}/rxjs`,

      // Deja Vu stuff
      "client-bus": `${npm}/client-bus/lib/client-bus.js`,
      "gql": `${npm}/gql/lib/gql.js`
    };

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

    grunt.initConfig({
      pkg: grunt.file.readJSON("package.json"),
      ts: {
        dev_client: {
          src: [typings, shared, components, "src/dv-dev/**/*.ts"],
          outDir: ["dist/public"],
          options: ts_client_opts
        },
        dev_server: {
          src: [typings, shared, server],
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
              src: _u.values(module_map).concat(deps),
              dest: "dist/public"
            },
            {
              expand: true,
              src: [`${npm}/rxjs/**`],
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
        default: {
          src: ["dist", "lib"]
        },
        dev: {
          src: ["dist", "src/dv-dev"]
        },
        lib: {
          src: ["lib"]
        }
      },

      watch: {
        express: {
          files: ["src/**/*.ts"],
          tasks: ["dv-mean:serve"],
          options: {
            spawn: false
          }
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
    });

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

        const hyphen = w => w.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
        const component = w => w + "Component";
        const imp = (w_name, w_imp_prefix) => `import {${component(w_name)}} ` +
          `from "${w_imp_prefix}/components/${hyphen(w_name)}/` +
          `${hyphen(w_name)}";`;
        const selector = w => `<dv-widget name="${w}"></dv-widget>`;

        let flat_widgets: Widget[] = _u.chain(widgets)
            .pluck("children")
            .without(null, undefined)
            .flatten()
            .value();
        flat_widgets = flat_widgets
          .concat(_u.map(widgets, w => ({name: w.name, path: w.path})));
        flat_widgets = _u.uniq(flat_widgets);

        const wid_imports = _u
          .map(flat_widgets, w => imp(w.name, ".."))
          .concat(_u.map(used_widgets, w => imp(w.name, w.fqelement + "/lib")))
          .join("\n");
        let wid_selectors = "";

        let route_config = "[]";

        const wid_names = _u.map(widgets, w => w.name);
        const wid_classes = "[" +
          _u.map(flat_widgets, w => w.name + "Component")
          .concat(_u.map(used_widgets, w => w.name + "Component"))
          .join() + "]";

        if (action === "dev") {
          wid_selectors = _u.map(wid_names, selector).join("\n");
        } else {
          const wid_with_paths = _u.filter(widgets, w => w.path !== undefined);
          const default_path = _u.findWhere(wid_with_paths, {name: main}).path;
          const routify = w => {
            if (w.children === undefined) {
              return `{path: "${w.path}", component: ${component(w.name)}}`;
            } else {
              return `{
                path: "${w.path}", component: ${component(w.name)},
                children: [${_u.map(w.children, routify).join()}]
              }`;
            }
          };
          route_config = "[" + _u
              .map(wid_with_paths, routify)
              .join() + ", " +
              `{path: '', redirectTo: '${default_path}', pathMatch: 'full'}` +
              "]";
        }

        let replace_patterns = [
          {match: "name", replacement: name},
          {match: "module_map", replacement: module_map},
          {match: "cliches", replacement: _u.keys(patterns)},
          {match: "comp_info", replacement: (
              grunt.file.exists("comp.json") ?
              grunt.file.readJSON("comp.json") : "{}")},
          {match: "wcomp_info", replacement: (
              grunt.file.exists("wcomp.json") ?
              grunt.file.readJSON("wcomp.json") : "{}")},
          {match: "mode", replacement: action},

          {match: "wid_names", replacement: wid_names},
          {match: "wid_imports", replacement: wid_imports},
          {match: "wid_classes", replacement: wid_classes},

          {match: "wid_selectors", replacement: wid_selectors},

          {match: "route_config", replacement: route_config}
        ];


        let port = 3002;
        const locs = {};
        locs[name] = "http://localhost:3000";

        Object.keys(patterns).forEach(p => {
          let instances_number = patterns[p];
          for (let i = 1; i <= instances_number; ++i) {
            const fqelement = (instances_number > 1) ? p + "-" + i : p;
            locs[fqelement] = "http://localhost:" + port;
            ++port;
          }
        });
        const locs_str = JSON.stringify(locs);
        replace_patterns.push({match: "locs", replacement: locs});

        grunt.config.merge(
          {replace: {dev: {options: {patterns: replace_patterns}}}});


        const comppath = grunt.file.exists("comp.json") ? "comp.json" : "";
        let express_config = {};
        express_config["main"] = {
          options: {
            script: "dist/app.js",
            background: true,
            args: [
              "--main", "--mode=" + action,
              "--fqelement=" + name,
              "--comppath=" + comppath ,
              "--locs=" + locs_str]
          }
        };

        port = 3002;
        Object.keys(patterns).forEach(p => {
          let instances_number = patterns[p];
          for (let i = 1; i <= instances_number; ++i) {
            const fqelement = (instances_number > 1) ? p + "-" + i : p;
            express_config[fqelement] = {
              options: {
                script: "node_modules/" + p + "/lib/app.js",
                background: true,
                args: [
                    "--fqelement=" + fqelement,
                    "--comppath=" + comppath, "--locs=" + locs_str]
              }
            };
            ++port;
          }
        });
        grunt.config.merge({express: express_config});

        grunt.task.run(["clean:dev"]);
        grunt.task.run(["replace:dev"]);
        grunt.task.run(["tslint", "ts:dev_client", "ts:dev_server"]);
        grunt.task.run(["copy:dev"]);
        grunt.task.run(["express", "watch"]);
      } else if (action === "lib") {
        grunt.log.writeln(name + " lib");
        grunt.task.run(
          ["clean:lib", "tslint", "ts:lib_client", "ts:lib_server",
           "copy:lib"]);
      } else if (action === "clean") {
        grunt.task.run("clean");
      } else {
        grunt.fail.fatal(
          "Unrecognized action " + action +
          ". Choose one of dev, test, or lib");
      }
    });
  }
}
