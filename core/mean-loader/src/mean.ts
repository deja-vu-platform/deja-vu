/// <reference path="../typings/tsd.d.ts" />
import * as express from "express";
import morgan = require("morgan");
// the mongodb tsd typings are wrong and we can't use them with promises
const mongodb = require("mongodb");
const command_line_args = require("command-line-args");


const cli = command_line_args([
  {name: "dbhost", type: String, defaultValue: "localhost"},
  {name: "dbport", type: Number, defaultValue: 27017},

  {name: "wshost", type: String, defaultValue: "localhost"},
  {name: "wsport", type: Number, defaultValue: 3000},

  {name: "bushost", type: String, defaultValue: "localhost"},
  {name: "busport", type: Number, defaultValue: 3001},

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

  constructor(public name: string, init_db?: (db, debug: boolean) => void) {
    const opts = cli.parse();
    this.loc = `http://${opts.wshost}:${opts.wsport}`;
    this.bushost = opts.bushost;
    this.busport = opts.busport;

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
    };

    this.ws.listen(opts.wsport, () => {
      console.log(`Listening with opts ${JSON.stringify(opts)}`);
    });
  }
}

export namespace GruntTask {
  export function task(grunt, optPatterns, element) {
    optPatterns = (typeof optPatterns === "undefined") ? {} : optPatterns;
    const patternsSrc = Object.keys(optPatterns).map(function(p) {
      return "node_modules/" + p + "/lib/components/**/*.{js,html,css}";
    });
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
    deps = deps.concat(patternsSrc);

    const components = "src/components/**/*.ts";
    const shared = "src/shared/**/*.ts";
    const server = "src/*.ts";
    const dev = "src/dev/**/*.ts";

    grunt.initConfig({
      pkg: grunt.file.readJSON("package.json"),
      ts: {
        dev_client: {
          src: [shared, components, dev],
          outDir: ["dist/public"],
          options: {
            verbose: true,
            target: "es5",
            module: "system",
            moduleResolution: "node",
            sourceMap: true,
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            removeComments: false,
            noImplicitAny: false
          }
        },
        dev_server: {
          src: [shared, server],
          outDir: ["dist"],
          options: {
            verbose: true,
            target: "es5",
            module: "commonjs",
            moduleResolution: "node",
            sourceMap: true,
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            removeComments: false,
            noImplicitAny: false
          }
        },
        lib_client: {
          src: [shared, components],
          outDir: ["lib"],
          options: {
            verbose: true,
            target: "es5",
            module: "system",
            moduleResolution: "node",
            sourceMap: true,
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            removeComments: false,
            noImplicitAny: false,
            declaration: true
          }
        },
        lib_server: {
          src: [shared, server],
          outDir: ["lib"],
          options: {
            verbose: true,
            target: "es5",
            module: "commonjs",
            moduleResolution: "node",
            sourceMap: true,
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            removeComments: false,
            noImplicitAny: false,
            declaration: true
          }
        },
      },

      copy: {
        dev: {
          files: [
            {
              expand: true,
              cwd: "src",
              src: ["components/**/*.{html,css}", "dev/**/*.{html,css}"],
              dest: "dist/public"
            },
            {
              expand: true,
              cwd: "src/dev",
              src: ["index.html"],
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
              src: Object.keys(optPatterns).map(function(p) {
                return "node_modules/" + p + "/lib/components/**/*.{html,css}";
              }),
              dest: "dist/public/components/",
              rename: function(dst, src) {
                return dst +
                  src.match("node_modules/.*/lib/components/(.*)")[1];
              }
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
            src: ["src/**/*.ts"]
          }
        }
      },

      clean: {
        default: {
          src: [
            "dist", "lib", "src/**/*.js", "src/**/*.js.map", "src/**/*.d.ts"]
        },
        dev: {
          src: ["dist"]
        },
        lib: {
          src: ["lib"]
        }
      },

      express: {
        dev: {
          options: {
            script: "dist/app.js",
            background: true,
            args: [
              "--wsport=3000", "--busport=3001", "--main", "--mode=dev"]
          }
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
              src: "dist/public/dev/boot.js",
              dest: "dist/public/dev"
            },
            { // get this info via flags
              expand: true,
              flatten: true,
              src: "dist/app.js",
              dest: "dist"
            },
            { // tmp hack: shouldn't have to do the replaces everywhere
              expand: true,
              cwd: "dist/",
              src: "**/**/**/*.js",
              dest: "dist/",
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

    grunt.registerTask("dv-mean", "Dv a mean element", function(action) {
      if (action === "dev") {
        grunt.log.writeln(this.name + " dev");
        grunt.task.run(
          ["clean:dev", "tslint", "ts:dev_client", "copy:dev",
            "ts:dev_server"]);

        if (Object.keys(optPatterns).length > 0) {
          let express_config = {};
          let replace_patterns = [];
          let port = 3002;

          replace_patterns.push({
            match: element + "-1",
            replacement: "http://localhost:3000"
          });

          grunt.log.writeln(
            "This element is a compound, will start a composer");
          express_config["composer"] = {
            options: {
              script: "node_modules/dv-composer/lib/app.js",
              background: true,
              args: ["--wsport=3001"]
            }
          };

          Object.keys(optPatterns).forEach(function(p) {
            let process_instance = function(p, instance_number) {
              express_config[p + "-" + instance_number] = {
                options: {
                  script: "node_modules/" + p + "/lib/app.js",
                  background: true,
                  args: ["--wsport=" + port, "--busport=3001"]
                }
              };
              replace_patterns.push({
                match: p + "-" + instance_number,
                replacement: "http://localhost:" + port
              });
              ++port;
            };
            let instances_number = optPatterns[p];
            for (let i = 1; i <= instances_number; ++i) {
              process_instance(p, i);
            }
          });

          grunt.config.merge({express: express_config});
          grunt.config.merge(
            {replace: {dev: {options: {patterns: replace_patterns}}}});
        }

        grunt.task.run(["replace:dev", "express", "watch"]);
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
