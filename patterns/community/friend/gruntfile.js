module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    ts: {
      dev_client: {
        src: ["src/user.ts", "src/client/**/*.ts", "src/dev/**/*.ts"],
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
        src: ["src/*.ts"],
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
        src: ["src/user.ts", "src/client/**/*.ts"],
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
            src: ["client/**/*.html"],
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
            src: ["client/**/*.html"],
            dest: "pack"
          }
        ]
      } 
    },

    tslint: {
      options: {
        configuration: "tslint.json"
      },
      default: {
        files: {
          src: ["src/**/*.ts"]
        }
      }
    },

    clean: {
      default: {
        src: ["dist", "src/**/*.js", "src/**/*.js.map", "src/**/*.d.ts"]
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
  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks("grunt-tslint");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-express-server");

  grunt.registerTask(
      "build.dev",
      ["clean:dev", "tslint", "ts:dev_client", "copy:dev", "ts:dev_server"]);
  grunt.registerTask(
      "serve.dev",
      ["build.dev", "express:dev"]);

  grunt.registerTask(
      "pack", ["clean:pack", "tslint", "ts:pack", "copy:pack"]);
}
