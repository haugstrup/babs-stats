# Warning: Work-in-progress. Expect ugly things.

# Bay Area Bike Share (BABS) Stats Generator

This is the first rough version of a stats generator for Bay Area Bike Share (BABS). BABS doesn't have a public API, but they do make trip data available on their website. Thus it's possible to scrape that data and convert it into a useful format such as JSON.

Note: BABS is run by [Alta Bicycle Share](http://www.altabicycleshare.com/) and it's possible that the same web portal is used for for the systems they run in other cities such as New York's *city bike*, Boston's *Hubway*, Washington DC's *capital bikeshare*, Chicago's *Divvy* and others.

## Examples

* [http://babs.hgstrp.com/](http://babs.hgstrp.com/)

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

* Amount of trips taken
* Total time spent biking
* Average trip duration
* Most popular routes (with average duration and trip count)
* Most popular stations employed

Since the data file is loaded asynchronously you can't server the HTML file under `file://`. So start a simple HTTP server in `www` with `python -m SimpleHTTPServer` or whatever and load up `localhost:8000`.

## Deploying to a webserver
There are grunt tasks for optmizing JS/CSS with requirejs and deploying to a webserver using rsync. For deployment to work you must define an ENV variable called `BABS_RSYNC_TARGET`. It should (surprise, surprise) be the `target` value for rsync.

Then you can fetch new trip data, optimize and transfer files with `grunt deploy`

# TODO

* Split babs.rb and babs.js into separate components for people that only want an API
* Rewrite babs.rb as a node.js module so everything is in javascript. Module should export a grunt task

* "Latest trip" tile: Make it into a carousel where one can navigate the latest 10 trips or so
  * Also strip parenthesis content from station names on that tile
* Adjust babs.js so we don't loop over collection more than necessary. Store sorted sets as properties etc.
* Make display of all trips
