define(['babs'], function(Babs) {

  return {
    init: function(data) {

      this.updated_on = moment.utc(data.updated_on);
      this.account_created_on = data.account_created_on;
      this.account_name = data.account_name;
      this.area = data.area;

      this.trips = new Babs({trips: data.trips, stations: data.stations});

      // Populate HTML elements
      this.populateMeta();

      this.populateBasicData();
      this.populateLatestTrip();
      this.populatePopularRoutes(this.trips.topRoutes());
      this.populatePopularStations(this.trips.topStations());

      this.populateMap();
      this.populateWeeklyDurations();

      $('.tooltip').tipsy({
        gravity: 's'
      });

    },

    tableTemplate: _.template('<table class="<%= className %>"><% if (headers) { %><thead><tr><% _.each(headers, function(header){ %><th><%= header %></th><% }) %></tr></thead><% } %><tbody><% _.each(rows, function(row){ %><tr><% _.each(row, function(cell){ %><td class="<%= cell.className %>"><%= cell.text %></td><% }) %></tr><% }) %></tbody></table>'),

    metaTemplate: _.template('Prepared for <%= name %>. Last updated <%= updated_on.fromNow() %>.'),

    barChartTemplate: _.template('<div class="bar-chart tooltip" title="<%= value %>% of trips involved this station"><div class="bar" style="width:<%= value %>%;"></div><div class="label"><%= label %></div></div>'),

    tripSummaryTemplate: _.template('<div class="trip-summary"><div class="route start"><%= start %></div><div class="route middle">&darr;</div><div class="route end"><%= end %></div><div class="duration"><%= duration %></div><div class="date"><%= date %></div></div>'),

    basicDataTemplate: _.template("<dl><dt>Number of trips</dt><dd><%= total %></dd><dt>Total time biking</dt><dd><%= duration %></dd><dt>First trip date</dt><dd><%= first %></dd><dt>Stations visited</dt><dd><%= count %></dd></dl><dl><dt>Shortest trip</dt><dd><%= shortest %></dd><dt>Longest trip</dt><dd><%= longest %></dd><dt>Average trip</dt><dd><%= average %></dd></dl>"),

    populateWeeklyDurations: function() {

    },

    populateMap: function() {

      var visitedStations = _.uniq(this.trips.stationList());

      this.map = new google.maps.Map($('#map').get(0), {
        center: new google.maps.LatLng(37.788975, -122.403452),
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        panControl: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        overviewMapControl: false
      });

      var pinIconVisited = new google.maps.MarkerImage(
          "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|82C7BC",
          null, /* size is determined at runtime */
          null, /* origin is 0,0 */
          null, /* anchor is bottom center of the scaled image */
          new google.maps.Size(18, 30)
      );

      var pinIcon = new google.maps.MarkerImage(
          "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|ccc",
          null, /* size is determined at runtime */
          null, /* origin is 0,0 */
          null, /* anchor is bottom center of the scaled image */
          new google.maps.Size(18, 30)
      );

      var markers = [];
      _.each(this.trips.stations, function(station){
        markers.push(new google.maps.Marker({
          position: new google.maps.LatLng(station.latitude, station.longitude),
          map: this.map,
          title: station.name,
          icon: _.include(visitedStations, station.name) ? pinIconVisited : pinIcon
        }));
      }, this);

    },

    populateMeta: function() {
      $('#meta').html(this.metaTemplate({
        name: this.account_name,
        updated_on: this.updated_on
      }));
    },

    populateBasicData: function() {
      var self = this;
      var tripsByDuration = this.trips.byDuration();
      var shortest = tripsByDuration.shift();
      var longest = tripsByDuration.pop();

      var tripsById = this.trips.byId();
      var first = tripsById.shift();

      var visitedStationCount = this.trips.visitedStationCount();
      var totalStationCount = this.trips.totalStationCount();
      var pie = "<div class='pie'>" + [visitedStationCount, totalStationCount-visitedStationCount].join(',') + "</div>";

      $('#basic').html(this.basicDataTemplate({
        total: this.trips.count() + ' trips',
        duration: this.secondsToString(this.trips.duration()),
        first: '<span class="tooltip" title="'+longest.start_station+' &rarr; '+longest.end_station+'">' + moment(first.start_date).format('MMM D, YYYY') + '</span>',
        count: pie,
        shortest: '<span class="tooltip" title="'+shortest.start_station+' &rarr; '+shortest.end_station+'">' + this.secondsToString(shortest.duration) + '</span>',
        longest: '<span class="tooltip" title="'+longest.start_station+' &rarr; '+longest.end_station+'">' + this.secondsToString(longest.duration) + '</span>',
        average: this.trips.averageDuration() + ' mins'
      }));

      $('#basic div.pie').sparkline('html', {
        type: 'pie',
        height:25,
        sliceColors: ['#82C7BC', '#dddddd'],
        offset: '-90',
        disableHighlight: true,
        tooltipFormatter: function(sparklines, options, fields) {
          if (fields.offset === 0) {
            return fields.value + ' stations visited in '+self.area+' ('+Math.round(fields.percent)+'%)';
          } else {
            return fields.value + ' stations not yet visited in '+self.area+' ('+Math.round(fields.percent)+'%)';
          }
        }
      });

    },

    populateLatestTrip: function() {
      var tripsById = this.trips.byId();
      var trip = tripsById.pop();

      $('#latest').html(this.tripSummaryTemplate({
        start: trip.start_station,
        end: trip.end_station,
        date: moment(trip.start_date).format('MMM D, YYYY'),
        duration: this.secondsToString(trip.duration, 'verbose')
      }));

    },

    populatePopularRoutes: function(topRoutes) {
      var self = this;

      $('#popular-routes').html(this.tableTemplate({
        className: 'popular-routes',
        headers: [
          'Stations',
          'Duration'
        ],
        rows: _.map(topRoutes, function(route){
          var lastTrip = _.clone(route.trips).pop();

          var sparkline = "<div class='sparkline'>" + _.pluck(route.trips, 'duration').join(',') + "</div>";

          return [
            {text: _.escape(route.stations[0]) + '&nbsp;&rarr;&nbsp;' + _.escape(route.stations[1])},
            {text: sparkline + Math.floor(lastTrip.duration/60) + '&nbsp;mins', className: 'sparkline'}
          ];
        }, this)
      }));

      $('#popular-routes div.sparkline').sparkline('html', {
        type: 'line',
        width:60,
        height:15,
        fillColor: false,
        lineColor: '#82C7BC',
        minSpotColor: false,
        maxSpotColor: false,
        highlightSpotColor: false,
        highlightLineColor: '#ccc',
        tooltipFormatter: function(sparklines, options, fields) {
          return self.secondsToString(fields.y, 'verbose');
        }
      });

    },

    populatePopularStations: function(topStations) {
      var html = [];
      _.each(topStations, function(station){
        html.push(this.barChartTemplate({label: station.name, value: Math.round((station.count/this.trips.count())*100)}));
      }, this);
      $('#popular-stations').html(html.join(''));
    },

    // Helpers
    secondsToString: function(seconds, type) {
      type = type || 'concise';
      var hours = Math.floor(seconds/3600);
      var minutes = Math.floor((seconds-(hours*3600))/60);
      var remaining_seconds = Math.floor(seconds-(hours*3600)-(minutes*60));

      function pad(number) {
        return number <= 9 ? '0'+number.toString() : number.toString();
      }

      var parts = [];
      if (hours > 0) {
        parts.push(type === 'verbose' ? (hours === 1 ? '1 hr' : hours + ' hrs') : pad(hours));
      }
      if (minutes > 0) {
        parts.push(type === 'verbose' ? (minutes === 1 ? '1 min' : minutes + ' mins') : pad(minutes));
      }
      parts.push(type === 'verbose' ? (remaining_seconds === 1 ? '1 sec' : remaining_seconds + ' secs') : pad(remaining_seconds));

      return type === 'verbose' ? parts.join(' ') : parts.join(':');
    }
  };
});
