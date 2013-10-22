require.config({
  paths: {
    propertyParser: 'vendor/require/propertyParser',
    goog: 'vendor/require/goog',
    async: 'vendor/require/async',
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
    'tipsy': ['jquery'],
    'sparkline': ['jquery'],
    'app': {
      deps: ['underscore', 'jquery', 'moment', 'sparkline', 'tipsy']
    }
  }
});

require(['app', 'sparkline', 'goog!visualization,1,packages:[corechart]', 'async!https://maps.googleapis.com/maps/api/js?sensor=false!callback'], function(app) {

  $.getJSON('babs.json', {}, function(data){
    app.init(data);
  });

});
