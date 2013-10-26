define(function() {

  require('underscore');

  return function(options) {
    var trips = _.sortBy(options.trips, function(trip){ return trip.id; });
    this.trips = trips;

    var stations = options.stations || [];
    this.stations = stations;

    this.count = function() {
      return trips.length;
    };

    this.duration = function() {
      var durations = _.pluck(trips, 'duration');
      return _.reduce(durations, function(memo, num){ return memo + num; }, 0);
    };

    this.averageDuration = function() {
      var totalDuration = this.duration(trips);
      return Math.floor((totalDuration/this.count())/60);
    };

    this.byDuration = function() {
      return _.sortBy(trips, function(trip){
        return trip.duration;
      });
    },

    this.totalStationCount = function() {
      return stations.length;
    },

    this.validStationNames = function() {
      return _.pluck(stations, 'name');
    },

    this.stationList = function() {
      var validStations = this.validStationNames();
      var stations = [];
      _.each(trips, function(station){
        if (_.contains(validStations, station.start_station)) {
          stations.push(station.start_station);
        }
        if (_.contains(validStations, station.end_station)) {
          stations.push(station.end_station);
        }
      });
      return stations;
    },

    this.visitedStationCount = function() {
      var stations = _.uniq(this.stationList());
      return stations.length;
    },

    this.topStations = function() {
      var stations = this.stationList();

      stations = _.countBy(stations, function(name){
        return name;
      }, this);

      stations = _.map(stations, function(count, name){
        return {count: count, name: name};
      });

      stations = _.sortBy(stations, function(station){
        return station.count*-1;
      });

      return _.first(stations, 5);
    };

    this.topRoutes = function() {
      var routes = {};

      _.each(trips, function(trip) {
        var stations = [trip.start_station, trip.end_station];
        var key = stations.join('::');
        if (routes[key]) {
          routes[key].count++;
          routes[key].trips.push(trip);
        } else {
          routes[key] = {count: 1, name: key, stations: stations, trips: [trip]};
        }
      });

      routes = _.sortBy(routes, function(route){
        return route.count*-1;
      });

      return _.first(routes, 5);
    };

    return this;
  };

});
