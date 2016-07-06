module.exports = function(grunt, optPatterns, element) {
  optPatterns = (typeof optPatterns === "undefined") ? {} : optPatterns;
  const patternsSrc = Object.keys(optPatterns).map(function(p) {
    return "node_modules/" + p + "/lib/components/**/*.{js,html,css}";
  });
  var deps = [
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
              return dst + src.match("node_modules/.*/lib/components/(.*)")[1];
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
        configuration: "node_modules/grunt-dv-mean/tasks/tslint.json"
      },
      default: {
        files: {
          src: ["src/**/*.ts"]
        }
      }
    },

    clean: {
      default: {
        src: ["dist", "lib", "src/**/*.js", "src/**/*.js.map", "src/**/*.d.ts"]
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
            "--wsport=3000", "--busport=3001", "--servepublic", "--debugdata"]
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
    if (action === "build") {
      grunt.log.writeln(this.name + " build");
      grunt.task.run(
        ["clean:dev", "tslint", "ts:dev_client", "copy:dev", "ts:dev_server"]);
    } else if (action === "serve") {
      grunt.log.writeln(this.name + " serve");
      grunt.task.run(
        ["clean:dev", "tslint", "ts:dev_client", "copy:dev", "ts:dev_server"]);

      if (Object.keys(optPatterns).length > 0) {
        var express_config = {};
        var replace_patterns = [];
        var port = 3002;

        replace_patterns.push({
          match: element + "-1",
          replacement: "http://localhost:3000"
        });

        grunt.log.writeln("This element is a compound, will start a composer");
        express_config["composer"] = {
          options: {
            script: "node_modules/dv-composer/lib/app.js",
            background: true,
            args: ["--wsport=3001"]
          }
        };

        Object.keys(optPatterns).forEach(function(p) {
          var process_instance = function(p, instance_number) {
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
          }
          var instances_number = optPatterns[p];
          for (var i = 1; i <= instances_number; ++i) {
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
