define(['babs'], function(Babs) {

  return {
    init: function(data) {

      this.updated_on = moment.utc(data.updated_on);
      this.account_created_on = data.account_created_on;
      this.account_name = data.account_name;

      this.trips = new Babs({trips: data.trips});

      // Populate HTML elements
      this.populateMeta();

      this.populateTotalTrips();
      this.populateTotalDuration();
      this.populateAverageDuration();

      this.populatePopularStations(this.trips.topStations());
      this.populatePopularRoutes(this.trips.topRoutes());

    },

    tableTemplate: _.template('<table class="<%= className %>"><% if (headers) { %><thead><tr><% _.each(headers, function(header){ %><th><%= header %></th><% }) %></tr></thead><% } %><tbody><% _.each(rows, function(row){ %><tr><% _.each(row, function(cell){ %><td class="<%= cell.className %>"><%= cell.text %></td><% }) %></tr><% }) %></tbody></table>'),

    metatemplate: _.template('Prepared for <%= name %>. Last updated <%= updated_on.fromNow() %>'),

    populateMeta: function() {
      $('#meta').html(this.metatemplate({
        name: this.account_name,
        updated_on: this.updated_on
      }));
    },

    populateTotalTrips: function() {
      $('#total-trips').text(this.trips.count());
    },

    populateTotalDuration: function() {
      $('#total-duration').html(this.secondsToString(this.trips.duration()));
    },

    populateAverageDuration: function() {
      $('#average-duration').text(this.trips.averageDuration());
    },

    populatePopularRoutes: function(topRoutes) {
      $('#popular-routes').html(this.tableTemplate({
        className: 'popular-routes',
        headers: ['Between', 'Count', 'Avg. Duration'],
        rows: _.map(topRoutes, function(route){
          var routeTrips = new Babs({trips: route.trips});
          return [
            {text: route.stations[0] + '&nbsp;&amp;&nbsp;' + route.stations[1]},
            {text: routeTrips.count(), className: 'number'},
            {text: routeTrips.averageDuration() + '&nbsp;min', className: 'number'}
          ];
        }, this)
      }));
    },

    populatePopularStations: function(topStations) {
      $('#popular-stations').html(this.tableTemplate({
        className: 'popular-stations',
        headers: null,
        rows: _.map(topStations, function(station){
          return [
            {text: station.name},
            {text: Math.round((station.count/this.trips.count())*100)+'%', className: 'number'}
          ];
        }, this)
      }));
    },

    // Helpers
    secondsToString: function(seconds) {
      var hours = Math.floor(seconds/3600);
      var minutes = Math.floor((seconds-(hours*3600))/60);
      return hours + '<span class="unit">hrs</span> ' + minutes + '<span class="unit">min</span>';
    }
  };
});
