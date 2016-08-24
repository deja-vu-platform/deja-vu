module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    ts: {
      lib: {
        src: ["src/mean.ts"],
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
      lib: {
        files: [{
            expand: true, cwd: "src/", src: "dev/*", dest: "lib"
            }]
      }
    },
    tslint: {
      options: {
        configuration: "tslint.json"
      },
      default: {
        files: {
          src: ["src/mean.ts"]
        }
      }
    },

    clean: {
      default: {
        src: ["lib", "src/**/*.js", "src/**/*.js.map", "src/**/*.d.ts"]
      },
      lib: {
        src: ["lib"]
      }
    }
  });

  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks("grunt-tslint");
  grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");

  grunt.registerTask(
      "lib", ["clean:lib", "tslint", "ts:lib", "copy:lib"]);
}
