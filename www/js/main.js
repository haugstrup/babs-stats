require.config({
  paths: {
    jquery: 'vendor/jquery.min',
    underscore: 'vendor/underscore-min',
    moment: 'vendor/moment.min',
    babs: 'lib/babs'
  },
  shim: {
    'underscore': {
      exports: '_'
    },
    'app': {
      deps: ['underscore', 'jquery', 'moment']
    }
  }
});

require(['app'], function(app) {

  $.getJSON('babs.json', {}, function(data){
    app.init(data);
  });

});
