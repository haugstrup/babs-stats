require.config({
  paths: {
    jquery: 'vendor/jquery.min',
    underscore: 'vendor/underscore-min',
    moment: 'vendor/moment.min',
    sparkline: 'vendor/jquery.sparkline.min',
    tipsy: 'vendor/jquery.tipsy',
    babs: 'lib/babs'
  },
  shim: {
    'underscore': {
      exports: '_'
    },
    'app': {
      deps: ['underscore', 'jquery', 'moment', 'sparkline', 'tipsy']
    }
  }
});

require(['app'], function(app) {

  $.getJSON('babs.json', {}, function(data){
    app.init(data);
  });

});
