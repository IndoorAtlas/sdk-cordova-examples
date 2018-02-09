# IndoorAtlas & Cordova example: Google Maps & Wayfinding

## Building and running

Clone the git repository:

```
git clone https://github.com/IndoorAtlas/sdk-cordova-examples
cd sdk-cordova-examples/CordovaExamples
```

Set your API keys in `www/js/APIKeys.js`. API keys can be generated at https://app.indooratlas.com/apps.
Google Maps API Keys are available at https://console.developers.google.com/apis/credentials.
Providing a Google Maps API key may not be mandatory when developing the application, but is needed for production

For iOS add
```
cordova platform add https://github.com/apache/cordova-ios.git#4.4.0-ios-sim
```
and Android
```
cordova platform add android
```

Add IndoorAtlas Cordova plugin and all other plugins needed in these examples
```
cordova plugin add cordova-plugin-spinner
cordova plugin add cordova-plugin-file
cordova plugin add https://github.com/IndoorAtlas/cordova-plugin.git
```

Build the project and run it
```
cordova build
cordova run
```

## Wayfinding

Before using wayfinding part of the example, you need to [create and download a graph](https://docs.indooratlas.com/manage/wayfinding/) from https://app.indooratlas.com. After you have added the graph to the example you can build and try it.

Replace wayfinding graph in `www/data/wayfinding-graph.json` with the previously downloaded graph.

You can select a destination by long-pressing the screen. The route is updated to start from the current location of you whenever a new location is obtained from the IndoorAtlas platform.

The part of the possibly multi-floor route that is on the current floor is
shown in blue and the rest of the route on the other floors is gray.
