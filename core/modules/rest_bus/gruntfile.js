module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    ts: {
      pack: {
        src: ["src/**/*.ts"],
        outDir: ["pack"],
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
        src: ["pack", "src/**/*.js", "src/**/*.js.map", "src/**/*.d.ts"]
      },
      pack: {
        src: ["pack"]
      }
    },
  });

  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks("grunt-tslint");
  grunt.loadNpmTasks("grunt-contrib-clean");

  grunt.registerTask(
      "pack", ["clean:pack", "tslint", "ts:pack"]);
}
