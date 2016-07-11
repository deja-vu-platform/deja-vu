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
  {name: "dbhost", type: String, defaultValue: "localhost"},
  {name: "dbport", type: Number, defaultValue: 27017},

  {name: "wshost", type: String, defaultValue: "localhost"},
  {name: "wsport", type: Number, defaultValue: 3000},

  {name: "bushost", type: String, defaultValue: "localhost"},
  {name: "busport", type: Number, defaultValue: 3001},

  {name: "comppath", type: String},
  {name: "locs", type: String},

  // Mode can be "dev" or "test".  In dev mode the development page is shown,
  // in test mode the main widget is shown
  {name: "mode", type: String, defaultValue: "dev"},
  // True if this is the cliche being run by the user
  {name: "main", type: Boolean}
]);


export class Mean {
  db; //: mongodb.Db;
  ws: express.Express;
  loc: string;
  bushost: string;
  busport: number;
  comp: any;
  locs: any;

  constructor(public name: string, init_db?: (db, debug: boolean) => void) {
    const opts = cli.parse();
    this.loc = `http://${opts.wshost}:${opts.wsport}`;
    this.bushost = opts.bushost;
    this.busport = opts.busport;
    if (opts.comppath !== undefined) {
      this.comp = JSON.parse(fs.readFileSync(opts.comppath, "utf8"));
    }
    this.locs = JSON.parse(opts.locs);

    console.log(`Starting MEAN ${name} at ${this.loc}`);

    const server = new mongodb.Server(
      opts.dbhost, opts.dbport, {socketOptions: {autoReconnect: true}});
    this.db = new mongodb.Db(
        `${name}-${opts.wshost}-${opts.wsport}-db`, server, {w: 1});
    this.db.open((err, db) => {
      if (err) {
        console.log("Error opening mongodb");
        throw err;
      }
      if (init_db !== undefined) {
        console.log(`Initializing db for MEAN ${name}`);
        init_db(db, opts.mode === "dev" && opts.main);
      }
    });

    this.ws = express();
    this.ws.use(morgan("dev"));

    if (opts.main) {
      console.log(`Serving public folder for MEAN ${name} at ${this.loc}`);
      this.ws.use(express.static("./dist/public"));
      const dist_dir = path.resolve(__dirname + "/../../../dist");
      if (opts.mode === "dev") {
        this.ws.use("/*", (req, res) => {
          res.sendFile("/public/dv-dev/index.html", {root: dist_dir});
        });
      } else {
        this.ws.use("/*", (req, res) => {
          res.sendFile("/public/index.html", {root: dist_dir});
        });
      }
    }

    this.ws.listen(opts.wsport, () => {
      console.log(`Listening with opts ${JSON.stringify(opts)}`);
    });
  }
}

export namespace GruntTask {
  export function task(grunt, name, widgets?, attachments?, main?, patterns?) {
    patterns = (typeof patterns === "undefined") ? {} : patterns;
    const patterns_src = Object.keys(patterns)
        .map(p => `node_modules/${p}/lib/components/**/*.{js,html,css}`);
    let deps = [
      "node_modules/angular2/bundles/angular2-polyfills.js",
      "node_modules/systemjs/dist/system.src.js",
      "node_modules/rxjs/bundles/Rx.js",
      "node_modules/angular2/bundles/angular2.dev.js",
      "node_modules/angular2/bundles/http.js",
      "node_modules/angular2/bundles/router.dev.js",
      "node_modules/client-bus/lib/client-bus.js",
      "node_modules/underscore/underscore.js"
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
      noImplicitAny: false
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
              "no-duplicate-key": true,
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
            src: ["src/**/!(boot).ts"]
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
      if (action === "dev") {
        grunt.log.writeln(this.name + " dev");


        const hyphen = w => w.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
        const wid_imports = _u
            .map(widgets,
                 w => `import {${w}Component} from ` +
                      `"../components/${hyphen(w)}/${hyphen(w)}";`)
            .join("\n");
        const wid_directives = "[" +
            _u.map(widgets, w => w + "Component").join() + "]";

        const wid_attachments = "[" +
            _u.map(attachments, a => a + "Component").join() + "]";

        const wid_selectors = _u
            .map(widgets, w => `<${hyphen(w)}></${hyphen(w)}>`)
            .join("\n");

        let replace_patterns = [
          {match: "name", replacement: name},
          {match: "deps", replacement: _u.keys(patterns)},
          {match: "comp_info", replacement: grunt.file.readJSON("comp.json")},
          {match: "widgets", replacement: widgets},
          {match: "wid_imports", replacement: wid_imports},
          {match: "wid_directives", replacement: wid_directives},
          {match: "wid_selectors", replacement: wid_selectors},
          {match: "wid_attachments", replacement: wid_attachments}
        ];
        if (Object.keys(patterns).length > 0) {
          let express_config = {};


          replace_patterns.push({
            match: name + "-1",
            replacement: "http://localhost:3000"
          });

          let port = 3002;
          const locs = {};
          locs[name] = "http://localhost:3001";

          Object.keys(patterns).forEach(p => {
            let instances_number = patterns[p];
            if (instances_number === 1) {
              locs[p] = "http://localhost:" + port;
            } else {
              for (let i = 1; i <= instances_number; ++i) {
                locs[p + "-" + i] = "http://localhost:" + port;
                ++port;
              }
            }
          });

          const locs_str = JSON.stringify(locs);

          express_config["main"] = {
            options: {
              script: "dist/app.js",
              background: true,
              args: [
                "--wsport=3000", "--busport=3001", "--main", "--mode=dev",
                "--comppath=comp.json", "--locs=" + locs_str]
            }
          };

          grunt.log.writeln(
            "This cliche is a compound, will start a composer");
          express_config["composer"] = {
            options: {
              script: "node_modules/dv-composer/lib/app.js",
              background: true,
              args: [
                "--wsport=3001", "--comppath=comp.json", "--locs=" + locs_str]
            }
          };


          port = 3002;
          Object.keys(patterns).forEach(p => {
            let process_instance = (p, instance_number) => {
              express_config[p + "-" + instance_number] = {
                options: {
                  script: "node_modules/" + p + "/lib/app.js",
                  background: true,
                  args: [
                      "--wsport=" + port, "--busport=3001",
                      "--comppath=comp.json", "--locs=" + locs_str]
                }
              };
              replace_patterns.push({
                match: p + "-" + instance_number,
                replacement: "http://localhost:" + port
              });
              ++port;
            };
            let instances_number = patterns[p];
            for (let i = 1; i <= instances_number; ++i) {
              process_instance(p, i);
            }
          });
          replace_patterns.push({match: "locs", replacement: locs});

          grunt.config.merge({express: express_config});
          grunt.config.merge(
            {replace: {dev: {options: {patterns: replace_patterns}}}});
        }
        grunt.task.run(["clean:dev"]);
        grunt.task.run(["replace:dev"]);
        grunt.task.run(["tslint", "ts:dev_client", "ts:dev_server"]);
        grunt.task.run(["copy:dev"]);
        grunt.task.run(["express", "watch"]);
      } else if (action === "lib") {
        grunt.log.writeln(this.name + " lib");
        grunt.task.run(
          ["clean:lib", "tslint", "ts:lib_client", "ts:lib_server",
           "copy:lib"]);
      } else { // clean
        grunt.task.run("clean");
      }
    });
  }
}
