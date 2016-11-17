/// <reference path="../typings/tsd.d.ts" />
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
}

export namespace GruntTask {
  export function task(
      grunt, name: string, widgets?: Widget[], attachments?: string[],
      main?: string, patterns?) {
    attachments = attachments === undefined ? [] : attachments;
    widgets = widgets === undefined ? [] : widgets;
    patterns = patterns === undefined ? {} : patterns;
    const patterns_src = Object.keys(patterns)
        .map(p => `node_modules/${p}/lib/{components,shared}/**/` +
                  "*.{js,html,css}");
    let deps = [
      "node_modules/angular2/bundles/angular2-polyfills.js",
      "node_modules/systemjs/dist/system.src.js",
      "node_modules/rxjs/bundles/Rx.js",
      "node_modules/angular2/bundles/angular2.dev.js",
      "node_modules/angular2/bundles/http.js",
      "node_modules/angular2/bundles/router.dev.js",
      "node_modules/client-bus/lib/client-bus.js",
      "node_modules/underscore/underscore.js",
      "node_modules/gql/lib/gql.js",
      "node_modules/underscore.string/dist/underscore.string.min.js"
    ];
    deps = deps.concat(patterns_src);

    const ts_base_opts = {
      verbose: true,
      target: "es5",
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

    const components = "src/components/**/*.ts";
    const shared = "src/shared/**/*.ts";
    const server = "src/*.ts";

    grunt.initConfig({
      pkg: grunt.file.readJSON("package.json"),
      ts: {
        dev_client: {
          src: [shared, components, "src/dv-dev/**/*.ts"],
          outDir: ["dist/public"],
          options: ts_client_opts
        },
        dev_server: {
          src: [shared, server],
          outDir: ["dist"],
          options: ts_server_opts
        },
        lib_client: {
          src: [shared, components],
          outDir: ["lib"],
          options: _u.extend({declaration: true}, ts_client_opts)
        },
        lib_server: {
          src: [shared, server],
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
              src: ["components/**/*.{html,css}"],
              dest: "dist/public"
            },
            {
              expand: true,
              src: deps,
              dest: "dist/public"
            },
            // https://github.com/angular/angular/issues/6053
            {
              expand: true,
              src: Object.keys(patterns)
                   .map(p => `node_modules/${p}/lib/components/` +
                             "**/*.{html,css}"),
              dest: "dist/public/components/",
              rename: (dst, src) => (
                           dst +
                           src.match("node_modules/.*/lib/components/(.*)")[1])
            },
            {
              expand: true,
              cwd: "src/dv-dev",
              src: ["**/*.{html,css}"],
              dest: "dist/public/dv-dev"
            }
          ]
        },
        lib: {
          files: [
            {
              expand: true,
              cwd: "src",
              src: ["components/**/*.{html,css}"],
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
          src: [
            "dist", "lib", "src/**/*.js", "src/**/*.js.map", "src/**/*.d.ts"]
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
        const imp = w => `import {${component(w)}} from ` +
                         `"../components/${hyphen(w)}/${hyphen(w)}";`;
        const selector = w => `<dv-widget name="${w}"></dv-widget>`;

        let wid_imports = "";
        let wid_directives = "[]";
        let wid_selectors = "";

        let route_config = "";

        let attachments_imports = "";

        const wid_names = _u.map(widgets, w => w.name);

        if (action === "dev") {
          wid_imports = "import {WidgetLoader} from 'client-bus'";
          wid_directives = "[WidgetLoader]";
          wid_selectors = _u.map(wid_names, selector).join("\n");
        } else {
          const wid_with_paths = _u.filter(widgets, w => w.path !== undefined);
          wid_imports = _u.map(wid_with_paths, w => imp(w.name)).join("\n");
          route_config = "@RouteConfig([" + _u
              .map(wid_with_paths,
                   w => `{
                     path: "${w.path}", component: ${component(w.name)},
                     useAsDefault: ${w.name === main}
                   }`)
              .join() + "])";

          attachments_imports =  _u.map(attachments, imp).join("\n");
        }

        const wid_attachments = "[" +
            _u.map(attachments, component).join() + "]";


        let replace_patterns = [
          {match: "name", replacement: name},
          {match: "deps", replacement: _u.keys(patterns)},
          {match: "comp_info", replacement: (
              grunt.file.exists("comp.json") ?
              grunt.file.readJSON("comp.json") : "{}")},
          {match: "wcomp_info", replacement: (
              grunt.file.exists("wcomp.json") ?
              grunt.file.readJSON("wcomp.json") : "{}")},
          {match: "wid_attachments", replacement: wid_attachments},
          {match: "mode", replacement: action},

          {match: "wid_names", replacement: wid_names},
          {match: "wid_imports", replacement: wid_imports},

          {match: "wid_directives", replacement: wid_directives},
          {match: "wid_selectors", replacement: wid_selectors},

          {match: "attachments_imports", replacement: attachments_imports},
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
      } else { // clean
        grunt.task.run("clean");
      }
    });
  }
}
