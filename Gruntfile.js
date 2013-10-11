module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    requirejs: {
      production: {
        options: {
          appDir: "./www",
          baseUrl: "js",
          mainConfigFile: "./www/js/main.js",
          dir: './build',
          modules: [
            { name: "main" }
          ]
        }
      }
    }
  });


  grunt.loadNpmTasks('grunt-contrib-requirejs');
};
