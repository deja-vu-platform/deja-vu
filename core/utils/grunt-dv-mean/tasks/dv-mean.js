module.exports = function(grunt) {

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
      pack: {
        src: [shared, components],
        outDir: ["pack"],
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
            src: [
              "node_modules/angular2/bundles/angular2-polyfills.js",
              "node_modules/systemjs/dist/system.src.js",
              "node_modules/rxjs/bundles/Rx.js",
              "node_modules/angular2/bundles/angular2.dev.js",
              "node_modules/angular2/bundles/http.js"
            ],
            dest: "dist/public"
          }
        ]
        },
      pack: {
        files: [
          {
            expand: true,
            cwd: "src",
            src: ["components/**/*.html"],
            dest: "pack"
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
        src: ["dist", "pack", "src/**/*.js", "src/**/*.js.map", "src/**/*.d.ts"]
      },
      dev: {
        src: ["dist"]
      },
      pack: {
        src: ["pack"]
      }
    },

    express: {
      dev: {
        options: {
         script: "dist/app.js",
         background: false
        }
      }
    }
  });

  const base = "grunt-dv-mean/node_modules/";
  grunt.loadNpmTasks(base + "grunt-ts");
  grunt.loadNpmTasks(base + "grunt-tslint");
  grunt.loadNpmTasks(base + "grunt-contrib-clean");
  grunt.loadNpmTasks(base + "grunt-contrib-copy");
  grunt.loadNpmTasks(base + "grunt-express-server");

  grunt.registerTask("dv-mean", "Dv a mean element", function(action) {
    if (action === "build") {
      grunt.log.writeln(this.name + " build");
      grunt.task.run(
        ["clean:dev", "tslint", "ts:dev_client", "copy:dev", "ts:dev_server"]);
    } else if (action === "serve") {
      grunt.log.writeln(this.name + " serve");
      grunt.task.run(
        ["clean:dev", "tslint", "ts:dev_client", "copy:dev", "ts:dev_server",
         "express:dev"]);
    } else if (action === "pack") {
      grunt.log.writeln(this.name + " pack");
      grunt.task.run(
        ["clean:pack", "tslint", "ts:pack", "copy:pack"]);
    } else { // clean
      grunt.task.run("clean");
    }
  });
}
