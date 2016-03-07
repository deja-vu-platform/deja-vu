module.exports = function(grunt, optPatterns) {
  optPatterns = (typeof optPatterns === "undefined") ? [] : optPatterns;
  const patternsSrc = optPatterns.map(function(p) {
        return "node_modules/" + p + "/lib/components/**/*.{js,html}";
  });
  var deps = [
    "node_modules/angular2/bundles/angular2-polyfills.js",
    "node_modules/systemjs/dist/system.src.js",
    "node_modules/rxjs/bundles/Rx.js",
    "node_modules/angular2/bundles/angular2.dev.js",
    "node_modules/angular2/bundles/http.js",
    "node_modules/angular2/bundles/router.dev.js"
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
            src: ["components/**/*.html", "dev/**/*.html"],
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
            src: optPatterns.map(function(p) {
              return "node_modules/" + p + "/lib/components/**/*.html";
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
            src: ["components/**/*.html"],
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
          args: ["--wsport=3000", "--busport=3001"]
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
          }
        ]
      }
    }
  });

  const base = "grunt-dv-mean/node_modules/";
  grunt.loadNpmTasks(base + "grunt-ts");
  grunt.loadNpmTasks(base + "grunt-tslint");
  grunt.loadNpmTasks(base + "grunt-contrib-clean");
  grunt.loadNpmTasks(base + "grunt-contrib-copy");
  grunt.loadNpmTasks(base + "grunt-express-server");
  grunt.loadNpmTasks(base + "grunt-contrib-watch");
  grunt.loadNpmTasks(base + "grunt-replace");

  grunt.registerTask("dv-mean", "Dv a mean element", function(action) {
    if (action === "build") {
      grunt.log.writeln(this.name + " build");
      grunt.task.run(
        ["clean:dev", "tslint", "ts:dev_client", "copy:dev", "ts:dev_server"]);
    } else if (action === "serve") {
      grunt.log.writeln(this.name + " serve");
      grunt.task.run(
        ["clean:dev", "tslint", "ts:dev_client", "copy:dev", "ts:dev_server"]);
      var express_config = {};
      var replace_patterns = [];
      var port = 3002;

      if (optPatterns.length > 0) {
        grunt.log.writeln("This element is a compound, will start a composer");
        express_config["composer"] = {
          options: {
            script: "node_modules/dv-composer/lib/app.js",
            background: true,
            args: ["--wsport=3001", "--servepublic=false"]
          }
        };
      }
      optPatterns.forEach(function(p) {
        express_config[p] = {
          options: {
            script: "node_modules/" + p + "/lib/app.js",
            background: true,
            args: ["--wsport=" + port, "--servepublic=false", "--busport=3001"]
          }
        };
        replace_patterns.push(
          {match: p, replacement: "http://localhost:" + port});
        ++port;
      });
      grunt.config.merge({express: express_config});
      grunt.config.merge(
        {replace: {dev: {options: {patterns: replace_patterns}}}});
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
