# IndoorAtlas & Cordova example: Leaflet and Mapbox

## Building and running

Clone the git repository:

```
git clone https://github.com/IndoorAtlas/sdk-cordova-examples
cd sdk-cordova-examples/LeafletExample
```

Set your API keys in `www/js/APIKeys.js`. API keys can be generated at https://app.indooratlas.com/apps.
Get a Mapbox access token from https://mapbox.com.
It is also possible to run this example without a Mabox access token, in which
case no outdoor map is shown under the floor plan images.

For iOS add
```
cordova platform add https://github.com/apache/cordova-ios.git#4.4.0-ios-sim
```
and Android
```
cordova platform add android
```

Add IndoorAtlas Cordova plugin
```
cordova plugin add https://github.com/IndoorAtlas/cordova-plugin.git
```

Build the project and run it
```
cordova build
cordova run
```
