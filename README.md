# Twitter analyzer example

A simple Twitter stream analyzer.

This program runs on node, and watches a twitter stream based on some location. Each tweet is tokenized and analyzed to gather some statistics:
* Words recurrences.
* Hashtags recurrences.

Analysis results are written on csv files every once in a while.

**Pay attention**: this program is a mere test to play with node and Twitter APIs. Use at your own risk.

## Configure

Create a `.env` file in the project root, then write configuration as follows:

```
TW_CONSUMERKEY="<twitter-api-consumer-key>"
TW_CONSUMERSECRET="<twitter-api-consumer-secret>"
TW_ACCESSTOKEN="<twitter-api-access-token>"
TW_ACCESSTOKENSECRET="<twitter-api-token-secret>"
LOCATION_BBOX="<raw_csv_bounding_box_of_a_location>"
ANALYSIS_LOG_INTERVAL="<log_interval_ie_1800000>"
DEBUG_PRINT_TWEETS="false"
```

While all the TW_* parameters speak for themselves, and are referred to your app, the LOCATION_BBOX parameter refers to the "locations" parameter of the Twitter APIs (see. https://developer.twitter.com/en/docs/tweets/filter-realtime/guides/basic-stream-parameters#locations). The ANALYSIS_LOG_INTERVAL parameter instead sets the timeout (in milliseconds) for the analysis log; this means that the program will output two different csv files with every ANALYSIS_LOG_INTERVAL milliseconds.
DEBUG_PRINT_TWEETS parameter can be "true" or "false": this specifies if you want to console.log some information about each tweet that's been captured in the stream (for debug purposes obviously).

Locations parameter is defined as a comma-separated list of longitude,latitude pairs, in example:
* Rome (IT): "12.341707,41.769596,12.730289,42.050546"
* Bologna (IT): "10.955,44.3195,11.7303,44.672"
* Ravenna (IT): "11.8326463073,44.28909852,12.4042785168,44.5852253194"

You can also create a custom location bounding boxes on one of these sites:
* http://boundingbox.klokantech.com/
* http://www.mapdevelopers.com/geocode_bounding_box.php

## Run

To run the application, just type the following commands. Please remember that the app must be configured first (see the Configure paragraph).

```bash
sudo -u www-data nohup node index.js > log.log 2>&1 &
top -bn1 | grep node index.js
tail -f log.log
```
