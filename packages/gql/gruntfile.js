module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    ts: {
      lib: {
        src: ["src/**/*.ts"],
        outDir: ["lib"],
        options: {
          verbose: true,
          target: "es6",
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

  grunt.registerTask(
      "lib", ["clean:lib", "tslint", "ts:lib"]);
}
