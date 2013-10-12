require.config({
  paths: {
    async: 'vendor/async',
    jquery: 'vendor/jquery.min',
    underscore: 'vendor/underscore-min',
    moment: 'vendor/moment.min',
    sparkline: 'vendor/jquery.sparkline',
    tipsy: 'vendor/jquery.tipsy',
    babs: 'lib/babs'
  },
  shim: {
    'underscore': {
      exports: '_'
    },
    'sparkline': ['jquery'],
    'app': {
      deps: ['underscore', 'jquery', 'moment', 'sparkline', 'tipsy']
    }
  }
});

require(['app', 'sparkline', 'async!https://maps.googleapis.com/maps/api/js?sensor=false!callback'], function(app) {

  $.getJSON('babs.json', {}, function(data){
    app.init(data);
  });

});
