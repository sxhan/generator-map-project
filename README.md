# Udacity Full Stack Web Developer Nanodegree Project 6: Map of Power Generators in California
A pure client side application for exploring registered power generators around you.
Makes use of the [Google Maps API](https://developers.google.com/maps/) and the [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page).
Generator data extracted from [EIA](https://www.eia.gov/electricity/data/eia860/).

## Demo Site
See it in action [here](https://map.thoughtforyourthoughts.com/)

## Usage
1. Move around the map as you normally would on google maps, and explore the different generator locations
2. Click on a marker to show additional information about the generator. Relevant wikipedia articles of the generator's Utility company will also be displayed, if it exists
3. Click the filter button to bring up a sidenav area and view a list of all generators by name
4. Hover over the names to see more information
5. Enter some text into the 'Filter' field and either click the go button or press enter to filter for any location containing the string in any of its fields
6. Click on an item in the list view to go to that location on the map

## Running Locally
1. Clone the repository at `git clone git@github.com:sxhan/generator-map-project.git`
2. Change directory into the project directory: `cd generator-map-project`
3. To access all the features, you must use a local server to serve the website. This can be done very easily in [python](https://docs.python.org/2/library/simplehttpserver.html) or [ nodejs](https://www.npmjs.com/package/http-server):
 - If you have python 2 installed, run: `python -m SimpleHTTPServer 8000`. Note that this will serve on `0.0.0.0` instead of `localhost`
 - If you have python 3 installed, run: `python -m http.server 8000 --bind 127.0.0.1`
 - If you have npm:
    - Install http-server globally if you have not already done so: `npm install http-server -g`. You may need `sudo` to perform this action.
    - Start the server with: `http-server . -p 8000 -a 127.0.0.1`
4. Depending on how you performed step 3, you'll see different messages that indicate success or failure. See documentation specific to python or nodejs http-server for more details.
5. Access the site at *http://localhost:8000/*. The port value of 8000 value may differ, depending on how the server was created.
