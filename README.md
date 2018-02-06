
# IndoorAtlas Cordova Plugin Examples

[IndoorAtlas](https://www.indooratlas.com/) provides a unique Platform-as-a-Service (PaaS) solution that runs a disruptive geomagnetic positioning in its full-stack hybrid technology for accurately pinpointing a location inside a building. The IndoorAtlas SDK enables app developers to use high-accuracy indoor positioning in venues that have been fingerprinted.

This repository provides examples for IndoorAtlas Cordova Plugin.


Getting started requires you to set up a free developer account and fingerprint your indoor venue using the [IndoorAtlas MapCreator 2](https://play.google.com/store/apps/details?id=com.indooratlas.android.apps.jaywalker).

* [Getting Started](#getting-started)
    * [Set up your account](#set-up-your-account)
    * [Get started with Cordova Examples](#get-started-with-cordova-examples)
* [Wayfinding](#wayfinding)
* [Documentation](#documentation)
* [License](#license)

## Getting Started

### Set up your account

* Set up your [free developer account](https://app.indooratlas.com) in the IndoorAtlas developer portal. Help with getting started is available in the [Quick Start Guide](http://docs.indooratlas.com/quick-start-guide.html).
* To enable IndoorAtlas indoor positioning in a venue, the venue needs to be fingerprinted with the [IndoorAtlas MapCreator 2](https://play.google.com/store/apps/details?id=com.indooratlas.android.apps.jaywalker) tool.
* To start developing your own app, create an [API key](https://app.indooratlas.com/apps).

### Get started with Cordova Examples

Clone the following git repository:

```
git clone https://github.com/IndoorAtlas/sdk-cordova-examples
cd sdk-cordova-examples/CordovaExamples
```

Set your API keys in `www/js/APIKeys.js`. API keys can be generated at https://app.indooratlas.com/apps. Google Maps API Keys are available at https://console.developers.google.com/apis/credentials

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

## Documentation

Documentation for the Cordova plugin is available in the documentation portal: [http://docs.indooratlas.com/cordova](http://docs.indooratlas.com/cordova).

## License

Copyright 2015-2017 IndoorAtlas Ltd. The Cordova Plugin is released under the Apache License. See the [LICENSE.md](https://github.com/IndoorAtlas/sdk-cordova-examples/blob/master/LICENSE) file for details.
