module.exports = function(grunt) {
  var exec = require("child_process").exec;
  var log = grunt.log;
  var fatal = grunt.fail.fatal;

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

  grunt.registerTask(
    'fetch',
    'Fetch fresh data from bike share website',
    function(){
      var done = this.async();

      exec('ruby utils/babs.rb', function(err, stdout, stderr){
        if ( err ) {
          fatal("Problem with babs.rb: " + err + " " + stderr );
        }
        log.ok(stdout);
        log.ok("Fetch complete.");
        done();
      });

    }
  );

  grunt.loadNpmTasks('grunt-contrib-requirejs');
};
