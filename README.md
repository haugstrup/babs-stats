# Bay Area Bike Share Stats Generator

This is the first rough version of a stats generator for Bay Area Bike Share (BABS). BABS doesn't have a public API, but they do make trip data available on their website. Thus it's possible to scrape that data and convert it into a useful format such as JSON.

Note: BABS is run by [Alta Bicycle Share](http://www.altabicycleshare.com/) and it's possible that the same web portal is used for for the systems they run in other cities such as New York's *city bike*, Boston's *Hubway*, Washington DC's *capital bikeshare*, Chicago's *Divvy* and others. If that's the case it should be trivial to generate data from there as well.

## Examples

* [http://babs.hgstrp.com/](http://babs.hgstrp.com/)
* _...your website_

## Before doing anything

Make sure you have node and npm installed. Run `npm install` to grab dependencies. Otherwise not much will work.

## Scraping trip data
You'll find a handy ruby script in `utils/babs.rb`. This scrapes trip data and converts it into JSON. For now the JSON file is just placed  directly into `www/babs.json`. You must have the follow ENV variables set:

* BABS_USER: Your BABS username
* BABS_PASS: Your BABS password

You must have the following gems installed:

* mechanize
* nokogiri
* oj

Run it with grunt `grunt fetch`

## Viewing your stats
There's a small JS app that will display your stats for you. Currently the following data is generated:

* Basic info (no. of trips, total duration, shortest & longest trips etc.)
* Latest trips taken with date and duration
* Most popular routes
* Weekly usage
* Google Map showing visited stations
* Most popular stations

Since the data file is loaded asynchronously you can't server the HTML file under `file://`. A small server script is included. Run it with `node server.js` and then hit up [http://localhost:8000](http://localhost:8000)

If you want to see other numbers create an issue or a pull request.

## Deploying to a webserver
There are grunt tasks for optmizing JS/CSS with requirejs and deploying to a webserver using rsync. For deployment to work you must define an ENV variable called `BABS_RSYNC_TARGET`. It should (surprise, surprise) be the `target` value for rsync.

Then you can fetch new trip data, optimize and transfer files with `grunt deploy`

# TODO

* Rewrite babs.rb as a node.js module so all dependencies can be handled with npm.
