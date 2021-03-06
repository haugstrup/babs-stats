define(['babs'], function(Babs) {

  return {
    init: function(data) {

      this.updated_on = moment.utc(data.updated_on);
      this.account_created_on = data.account_created_on;
      this.account_name = data.account_name;
      this.area = data.area;

      if (data.trips.length) {
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
      }

    },

    tableTemplate: _.template('<table class="<%= className %>"><% if (headers) { %><thead><tr><% _.each(headers, function(header){ %><th><%= header %></th><% }) %></tr></thead><% } %><tbody><% _.each(rows, function(row){ %><tr><% _.each(row, function(cell){ %><td class="<%= cell.className %>"><%= cell.text %></td><% }) %></tr><% }) %></tbody></table>'),

    metaTemplate: _.template('Prepared for <%= name %>. Last updated <%= updated_on.fromNow() %>.'),

    barChartTemplate: _.template('<div class="bar-chart tooltip" title="<%= value %>% of trips involved this station (<%= valueRaw %> trips)"><div class="bar" style="width:<%= value %>%;"></div><div class="label"><%= label %></div></div>'),

    tripSummaryTemplate: _.template('<div class="trip-summaries"><div class="inner"><% _.each(trips, function(trip){ %><div class="trip-summary"><div class="route start"><%= trip.start %></div><div class="route middle">&darr;</div><div class="route end"><%= trip.end %></div><div class="duration"><%= trip.duration %></div><div class="date"><%= trip.date %></div></div><% }) %></div></div>'),

    arrowTemplate: _.template('<div class="arrow left"><div class="inner"></div></div><div class="arrow right hidden"><div class="inner"></div></div>'),

    basicDataTemplate: _.template("<dl><dt>Number of trips</dt><dd><%= total %></dd><dt>Total time biking</dt><dd><%= duration %></dd><dt>First trip date</dt><dd><%= first %></dd><dt>Stations visited</dt><dd><%= count %></dd></dl><dl><dt>Shortest trip</dt><dd><%= shortest %></dd><dt>Longest trip</dt><dd><%= longest %></dd><dt>Average trip</dt><dd><%= average %></dd></dl>"),

    populateWeeklyDurations: function() {

      var durations = {};
      _.each(this.trips.trips, function(trip){
        var week = moment(trip.start_date).format('W');
        if (durations[week]) {
          durations[week] = durations[week] + trip.duration;
        } else {
          durations[week] = trip.duration;
        }
      });
      var weeks = _.keys(durations);
      var data = [];
      for (i=_.min(weeks); i<=_.max(weeks); i++) {
        data.push(['Week '+i.toString(), Math.round(durations[i]/60)]);
      }

      data.unshift(['Week', 'Trip durations']);
      var dataTable = google.visualization.arrayToDataTable(data);

      var formatter = new google.visualization.NumberFormat({suffix: ' min', fractionDigits: 0});
      formatter.format(dataTable, 1);

      var chart = new google.visualization.LineChart($('#weekly-durations').get(0));
      chart.draw(dataTable, {
        curveType:'none',
        colors: ['#82C7BC'],
        height:215,
        width:278,
        chartArea: {top:5, left:40, width:220, height:175},
        legend:{position:'none'},
        hAxis: {},
        vAxis: {minValue:0}
      });
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

      var first = _.clone(this.trips.trips).shift();

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
      var trips = this.trips.trips.slice(-10);
      var formattedTrips = _.map(trips, function(trip){
        return {
          start: trip.start_station.replace(/ \(.+\)/, ''),
          end: trip.end_station.replace(/ \(.+\)/, ''),
          date: moment(trip.start_date).format('MMM D, YYYY'),
          duration: this.secondsToString(trip.duration, 'verbose')
        };
      }, this);

      var summaryHTML = this.tripSummaryTemplate({
        trips: formattedTrips
      });

      $('#latest').html(this.arrowTemplate() + summaryHTML);

      // The simplest carousel
      var elmCarousel = $('#latest .trip-summaries .inner');
      var elmArrowRight = $('#latest .arrow.right');
      var elmArrowLeft = $('#latest .arrow.left');

      var stepMultiplier = elmCarousel.width();
      var steps = trips.length-1;
      var currentStep = steps;

      elmCarousel.css({left:steps*stepMultiplier*-1});
      $('#latest .arrow').click(function(){
        if ($(this).hasClass('left')) {
          currentStep--;
        } else {
          currentStep++;
        }
        elmCarousel.animate({'left': currentStep*stepMultiplier*-1}, 300);
        if (currentStep >= steps) {
          elmArrowRight.hide();
        } else if (currentStep === 0) {
          elmArrowLeft.hide();
        } else {
          elmArrowRight.show();
          elmArrowLeft.show();
        }
      });
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
        html.push(this.barChartTemplate({
          label: station.name,
          valueRaw: station.count,
          value: Math.round((station.count/this.trips.count())*100)
        }));
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
