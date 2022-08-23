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

### Android

Add Android platform
```
cordova platform add android@^11.0.0
```
Build the project and run it
```
cordova build
cordova run
```

### iOS

Add iOS platform
```
cordova platform add ios@^6.2.0
```
Open project in XCode
```
open platforms/ios/IACordova.xcworkspace
```
and build using XCode.

## Wayfinding

Before using wayfinding part of the example, you need to [create a wayfinding graph](https://docs.indooratlas.com/manage/wayfinding/) on https://app.indooratlas.com.

You can select a destination by pressing the screen. The route is updated to start from the
current location of you whenever a new location is obtained from the IndoorAtlas platform.
