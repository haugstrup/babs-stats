require 'net/http'
require 'rubygems'
require 'mechanize'
require 'nokogiri'
require 'oj'

username = ENV['BABS_USER']
password = ENV['BABS_PASS']
url      = 'https://bayareabikeshare.com/login'
stations_url = URI('http://bayareabikeshare.com/stations/json')
station_area = 'San Francisco'
json_path = File.expand_path(File.dirname(__FILE__)) + '/../www/babs.json'

agent = Mechanize.new { |agent|
  agent.user_agent_alias = 'Mac Safari'
}

page = agent.get(url)
login_form = page.forms.first
login_form.subscriberUsername = username
login_form.subscriberPassword = password

page = agent.submit(login_form, login_form.buttons.first)

profile_tables = page.search('table.member-profile')
created_on = profile_tables[1].search('tr')[1].search('td')[0].text.strip
name = profile_tables[2].search('tr')[0].search('td')[0].text.strip

page = page.link_with(:text => 'Trips').click

trips_table = page.search('#content table tbody tr')
trips = trips_table.map do |tr|
  row = tr.search('td')
  duration_raw = row[5].text.chomp('m').chomp('s').split(' ')
  duration = (duration_raw[0].to_i*60) + duration_raw[1].to_i

  {
    'id' => row[0].text.to_i,
    'start_date' => Date.strptime(row[2].text, '%m/%d/%y').strftime('%Y-%m-%d'),
    'end_date' => Date.strptime(row[4].text, '%m/%d/%y').strftime('%Y-%m-%d'),
    'start_station' => row[1].text,
    'end_station' => row[3].text,
    # 'start_station' => row[1].text.gsub(/ \(.+\)/, ''),
    # 'end_station' => row[3].text.gsub(/ \(.+\)/, ''),
    'duration' => duration
  }
end

stations_raw = Oj.load(Net::HTTP.get(stations_url))
stations_raw['stationBeanList'].keep_if {|station| station['landMark'] == station_area }
station_count = stations_raw['stationBeanList'].length

json = {trips => []}
if File.file?(json_path)
  json = Oj.load(File.open(json_path, 'rb') {|io| io.read})
end

# Update data
json.merge!({
  'updated_on' => Time.now.utc.strftime('%Y-%m-%d %H:%M:%S'),
  'account_created_on' => created_on,
  'account_name' => name,
  'area' => station_area,
  'stations' => stations_raw['stationBeanList'].map{|s| {
    'name' => s['stationName'],
    'latitude' => s['latitude'],
    'longitude' => s['longitude'],
    'id' => s['id']
  }}
})

trip_count_new = 0
trip_count_discarded = 0
trip_count_existing = 0

existing_trips = json['trips'].map{|trip| trip['id']}
trips.each do |trip|
  if existing_trips.include?(trip['id'])
    trip_count_existing += 1
    print "##{trip['id']} Skipping existing trip\n"
  elsif trip['duration'] < 60
    trip_count_discarded += 1
    print "##{trip['id']} Skipping trip under 1 min\n"
  else
    trip_count_new += 1
    print "##{trip['id']} Adding new trip\n"
  end
end

File.open(json_path, 'wb') {|f| f.write( Oj.dump(json) ) }
print "\n=================================\n"
print "Found #{station_count} stations in #{station_area}.\n"
print "Processed #{trips.length} trips.\n"
print "Left #{trip_count_existing} existing trips alone.\n"
print "Discarded #{trip_count_discarded} because they were under 1 minute.\n"
print "Added #{trip_count_new} new trips.\n"
