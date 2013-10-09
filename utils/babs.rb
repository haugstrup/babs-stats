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

  # Skip trips under 1 minute
  if duration > 60
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
end

trip_count_raw = trips.length
trips.compact!
trip_count = trips.length
trip_count_discarded = trip_count_raw - trip_count

stations_raw = Oj.load(Net::HTTP.get(stations_url))
stations_raw['stationBeanList'].keep_if {|station| station['landMark'] == station_area }
station_count = stations_raw['stationBeanList'].length

json = {
  'updated_on' => Time.now.utc.strftime('%Y-%m-%d %H:%M:%S'),
  'account_created_on' => created_on,
  'account_name' => name,
  'trips' => trips,
  'stations' => stations_raw['stationBeanList'].map{|s| {
    'name' => s['stationName'],
    'latitude' => s['latitude'],
    'longtitude' => s['longtitude'],
    'id' => s['id']
  }}
}

File.open(File.expand_path(File.dirname(__FILE__)) + '/../www/babs.json', 'w') {|f| f.write( Oj.dump(json) ) }
print "Processed #{trip_count} trips. Discarded #{trip_count_discarded} because they were under 1 minute.\n"
print "Found #{station_count} stations in #{station_area}.\n"
