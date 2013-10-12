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

  //
  grunt.registerTask(
    "transfer",
    "Transfer the build folder to external location defined by ENV var BABS_RSYNC_TARGET",
    function() {
      var done = this.async();
      if (!process.env.BABS_RSYNC_TARGET) {
        fatal("ENV variable BABS_RSYNC_TARGET not defined");
      } else {
        exec("rsync -rlv ./build/* "+process.env.BABS_RSYNC_TARGET,
        function( err, stdout, stderr ) {
          if ( err ) {
            fatal("Problem with rsync: " + err + " " + stderr );
          }
          log.writeln( stdout );
          log.ok("Rsync complete.");
          done();
        });
      }
    }
  );

  // Grab new trip data
  grunt.registerTask(
    'fetch',
    'Fetch fresh data from bike share website',
    function(){
      var done = this.async();

      exec('ruby utils/babs.rb', function(err, stdout, stderr){
        if ( err ) {
          fatal("Problem with babs.rb: " + err + " " + stderr );
        }
        log.writeln(stdout);
        log.ok("Fetch complete.");
        done();
      });

    }
  );

  // A full deploy, runs fetch, requirejs and transfer tasks
  grunt.registerTask(
    'deploy',
    'Deploy to external server. Runs fetch, requirejs and transfer tasks',
    function() {
      grunt.task.run(['fetch', 'requirejs', 'transfer']);
    }
  );

  grunt.loadNpmTasks('grunt-contrib-requirejs');
};
